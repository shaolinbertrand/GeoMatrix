class MotorGeometrico extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.angleX = 0.4;
        this.angleY = 0.5;
        
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };

        // Valores de entrada digitados pelo usuário (agora interpretados em metros)
        this.boxWidth = 4;
        this.boxHeight = 2;
        this.boxDepth = 3;
    }

    static get observedAttributes() {
        return ['largura', 'altura', 'profundidade'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (newValue && !isNaN(newValue)) {
            const valor = Number(newValue);
            if (name === 'largura') this.boxWidth = valor;
            if (name === 'altura') this.boxHeight = valor;
            if (name === 'profundidade') this.boxDepth = valor;
            
            this.render(); 
        }
    }

    connectedCallback() {
        this.shadowRoot.appendChild(this.canvas);
        this.style.display = 'block';
        this.style.width = '100%';
        this.style.height = '100%';
        
        if (!this.id) {
            this.id = 'custom-motor-geometrico';
        }

        setTimeout(() => {
            this.resizeCanvas();
            this.initEventListeners();
            this.tick();
        }, 100);

        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = this.offsetWidth || 600;
        this.canvas.height = this.offsetHeight || 500;
        this.render();
    }

    initEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;

            const deltaX = e.clientX - this.previousMousePosition.x;
            const deltaY = e.clientY - this.previousMousePosition.y;

            this.angleY += deltaX * 0.01;
            this.angleX += deltaY * 0.01;

            this.previousMousePosition = { x: e.clientX, y: e.clientY };
            this.render();
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
    }

    // MATEMÁTICA DA ESCALA NORMALIZADA INTERNA (CORRIGIDA PARA 100% DE PROPORÇÃO)
    getVertices() {
        // Encontra a maior dimensão digitada para servir de base de proporção
        const maxValor = Math.max(this.boxWidth, this.boxHeight, this.boxDepth) || 1;
        
        // Define dinamicamente o tamanho base de acordo com a menor dimensão do Canvas
        // Isso garante que o sólido se adapte perfeitamente a qualquer tamanho de tela no Wix
        const width = this.canvas.width || 600;
        const height = this.canvas.height || 500;
        const menorDimensaoTela = Math.min(width, height);
        
        // Fator de escala adaptativo (ocupa cerca de 35% do raio da tela para não cortar nas rotações)
        const tamanhoBaseVisual = menorDimensaoTela * 0.35;

        // Normaliza os tamanhos para que fiquem sempre visíveis e proporcionais
        const w = (this.boxWidth / maxValor) * tamanhoBaseVisual;
        const h = (this.boxHeight / maxValor) * tamanhoBaseVisual;
        const d = (this.boxDepth / maxValor) * tamanhoBaseVisual;

        return [
            {x: -w, y: -h, z: -d}, // 0
            {x:  w, y: -h, z: -d}, // 1
            {x:  w, y:  h, z: -d}, // 2
            {x: -w, y:  h, z: -d}, // 3
            {x: -w, y: -h, z:  d}, // 4
            {x:  w, y: -h, z:  d}, // 5
            {x:  w, y:  h, z:  d}, // 6
            {x: -w, y:  h, z:  d}  // 7
        ];
    }

    project(point, width, height) {
        // Ajustamos a distância de perspectiva para estabilizar o tamanho do objeto na tela
        const distance = 300;
        const f = 300; 

        // Rotações tridimensionais
        let y1 = point.y * Math.cos(this.angleX) - point.z * Math.sin(this.angleX);
        let z1 = point.y * Math.sin(this.angleX) + point.z * Math.cos(this.angleX);

        let x2 = point.x * Math.cos(this.angleY) + z1 * Math.sin(this.angleY);
        let z2 = -point.x * Math.sin(this.angleY) + z1 * Math.cos(this.angleY);
        
        const scale = f / (f + z2 + distance);
        
        // Removido o multiplicador fixo antigo (* 2) para alinhar com o novo cálculo responsivo
        return {
            x: x2 * scale + width / 2,
            y: y1 * scale + height / 2
        };
    }

    render() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, width, height);

        const vertices3D = this.getVertices();
        const points2D = vertices3D.map(v => this.project(v, width, height));

        this.ctx.strokeStyle = '#1A2B4C';
        this.ctx.lineWidth = 3;
        this.ctx.lineJoin = 'round';

        const edges = [
            [0, 1], [1, 2], [2, 3], [3, 0], 
            [4, 5], [5, 6], [6, 7], [7, 4], 
            [0, 4], [1, 5], [2, 6], [3, 7]  
        ];

        edges.forEach(([start, end]) => {
            this.ctx.beginPath();
            this.ctx.moveTo(points2D[start].x, points2D[start].y);
            this.ctx.lineTo(points2D[end].x, points2D[end].y);
            this.ctx.stroke();
        });

        this.ctx.fillStyle = '#FF4D4D';
        points2D.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 6, 0, 2 * Math.PI);
            this.ctx.fill();
        });

        // --- ADIÇÃO: EXIBIÇÃO DE MEDIDAS E RESULTADO EM METROS ---
        const volume = this.boxWidth * this.boxHeight * this.boxDepth;

        this.ctx.fillStyle = '#1A2B4C';
        this.ctx.font = 'bold 16px sans-serif';
        this.ctx.textBaseline = 'top';

        // Desenha as dimensões atuais
        this.ctx.fillText(`Largura: ${this.boxWidth.toFixed(2)} m`, 20, 20);
        this.ctx.fillText(`Altura: ${this.boxHeight.toFixed(2)} m`, 20, 45);
        this.ctx.fillText(`Profundidade: ${this.boxDepth.toFixed(2)} m`, 20, 70);

        // Desenha o resultado do Volume Total em Destaque
        this.ctx.fillStyle = '#2E7D32'; // Verde para destacar o resultado
        this.ctx.font = 'bold 18px sans-serif';
        this.ctx.fillText(`Volume Total: ${volume.toFixed(2)} m³`, 20, 105);
    }

    tick() {
        this.render();
        requestAnimationFrame(() => this.tick());
    }
}

customElements.define('motor-geometrico', MotorGeometrico);
