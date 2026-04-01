// --- SUPABASE CONFIG ---
const SUPABASE_URL = "https://jagjmtfblzbghqqnfyvl.supabase.co";
const SUPABASE_KEY = "sb_publishable_UUKWlPUYyPWe--bTsGRZHA_AK3QEAp6";
let supabaseInstance;
try { supabaseInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); } catch (e) {}

const TM_MODEL_URL = "https://teachablemachine.withgoogle.com/models/5C65Arvky/";

// ELEMENTOS
const elements = {
    authModal: document.getElementById('auth-modal'),
    marketing: document.getElementById('marketing-site'),
    dashboard: document.getElementById('dashboard'),
    cards: {
        voice: document.getElementById('card-voice-selector'),
        regDatos: document.getElementById('card-registro-datos'),
        regRostro: document.getElementById('card-registro-rostro'),
        loginDatos: document.getElementById('card-login-datos'),
        loginRostro: document.getElementById('card-login-rostro')
    },
    webcams: {
        selector: document.getElementById('webcam-selector'),
        reg: document.getElementById('webcam-reg'),
        login: document.getElementById('webcam-login')
    },
    voiceText: document.getElementById('detected-command'),
    userNameDisplay: document.getElementById('display-user-name'),
    userAvatarDisplay: document.getElementById('display-user-avatar')
};

let recognizer;
let currentStream = null;
let userToRegister = {};
let authenticatedUser = null;

// CARGA INICIAL
window.addEventListener('load', () => {
    document.querySelectorAll('#btn-login-trigger, #btn-hero-cta').forEach(btn => {
        btn.onclick = async (e) => {
            e.preventDefault();
            await startIAPortal();
        };
    });
    const closeBtn = document.querySelector('.modal-close');
    if (closeBtn) closeBtn.onclick = () => stopAll();
    setupAuthLogic();
});

const startIAPortal = async () => {
    try {
        console.log("Iniciando IA...");
        
        // 1. Pedir SOLO video (El audio lo pedirá el recognizer de TM)
        currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        elements.authModal.classList.remove('hidden');
        elements.authModal.classList.add('active');
        
        // Mostrar vista previa cámara
        showStepUI('voice');
        
        // 2. Encender el motor de Teachable Machine
        await initTeachableMachine();
        
        speak("Portal activo. Por favor di el comando de voz.");
        
    } catch (err) {
        console.error("Fallo de hardware:", err);
        alert("Error de cámara: Por favor, permite el acceso en tu navegador.");
    }
};

const initTeachableMachine = async () => {
    try {
        if (!recognizer) {
            console.log("Cargando modelo TM...");
            recognizer = speechCommands.create("BROWSER_FFT", undefined, TM_MODEL_URL + "model.json", TM_MODEL_URL + "metadata.json");
            await recognizer.ensureModelLoaded();
        }
        
        elements.voiceText.innerHTML = "<span class='pulse'>Escuchando...</span>";
        
        // 3. Este comando solicita permiso de micrófono automáticamente
        recognizer.listen(result => {
            const labels = recognizer.wordLabels();
            const scores = result.scores;
            const bestIndex = scores.indexOf(Math.max(...scores));
            const cmd = labels[bestIndex];
            
            // Umbral de confianza 0.85
            if (scores[bestIndex] > 0.85 && (cmd === "registrar" || cmd === "ingresar")) {
                console.log("IA DETECTÓ:", cmd);
                elements.voiceText.innerHTML = `Comando detectado: <b class="highlight">${cmd.toUpperCase()}</b>`;
                
                recognizer.stopListening();
                setTimeout(() => {
                    if (cmd === "registrar") showStepUI('regDatos');
                    else showStepUI('loginDatos');
                }, 1000);
            }
        }, { probabilityThreshold: 0.85 });
        
    } catch (e) {
        console.error("Error en Teachable Machine:", e);
        elements.voiceText.innerText = "IA NO DISPONIBLE";
    }
};

const showStepUI = (cardId) => {
    Object.values(elements.cards).forEach(c => c?.classList.add('hidden'));
    elements.cards[cardId]?.classList.remove('hidden');
    
    // Conectar cámara al elemento activo
    const v = elements.webcams[cardId === 'voice' ? 'selector' : (cardId === 'regRostro' ? 'reg' : 'login')];
    if (v && currentStream) v.srcObject = currentStream;
};

const stopAll = () => {
    elements.authModal.classList.remove('active');
    setTimeout(() => elements.authModal.classList.add('hidden'), 500);
    if (recognizer) recognizer.stopListening();
    if (currentStream) currentStream.getTracks().forEach(t => t.stop());
};

const setupAuthLogic = () => {
    document.getElementById('form-registro').onsubmit = (e) => {
        e.preventDefault();
        userToRegister = {
            nombre: document.getElementById('reg-nombre').value,
            email: document.getElementById('reg-email').value,
            user: document.getElementById('reg-usuario').value,
            pass: document.getElementById('reg-clave').value
        };
        showStepUI('regRostro');
    };

    document.getElementById('form-login').onsubmit = async (e) => {
        e.preventDefault();
        const u = document.getElementById('login-user').value;
        const p = document.getElementById('login-key').value;
        const { data } = await supabaseInstance.from('usuarios').select('*').eq('usuario', u).single();
        if (data && data.clave_hash === btoa(p)) {
            authenticatedUser = data;
            showStepUI('loginRostro');
            setTimeout(completeLogin, 3000);
        } else alert("Credenciales incorrectas.");
    };

    document.getElementById('btn-capture-photo').onclick = async () => {
        const canvas = document.getElementById('photo-canvas');
        const video = elements.webcams.reg;
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg'));
        const fName = `avatar_${Date.now()}.jpg`;

        const { data: upData, error: upErr } = await supabaseInstance.storage.from('avatars').upload(fName, blob);
        if (upErr) return alert(upErr.message);
        const { data: urlData } = supabaseInstance.storage.from('avatars').getPublicUrl(fName);

        const { error } = await supabaseInstance.from('usuarios').insert([{
            nombre_completo: userToRegister.nombre,
            correo: userToRegister.email,
            usuario: userToRegister.user,
            clave_hash: btoa(userToRegister.pass),
            foto_url: urlData.publicUrl
        }]);

        if (!error) {
            authenticatedUser = { nombre_completo: userToRegister.nombre, foto_url: urlData.publicUrl };
            completeLogin();
        } else alert(error.message);
    };

    document.getElementById('btn-logout').onclick = () => window.location.reload();
};

const completeLogin = () => {
    elements.marketing.classList.add('hidden');
    elements.dashboard.classList.remove('hidden');
    elements.authModal.classList.remove('active');
    elements.userNameDisplay.innerText = authenticatedUser.nombre_completo;
    elements.userAvatarDisplay.innerHTML = `<img src="${authenticatedUser.foto_url}">`;
};

const speak = (t) => { if (window.vapiInstance) window.vapiInstance.say(t); };
