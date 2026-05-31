import React, { useEffect, useState } from 'react';

export default function MotorGeometrico({ largura, altura, profundidade }) {
    const [scriptCarregado, setScriptCarregado] = useState(false);

    useEffect(() => {
        // Verifica se o componente customizado já foi registrado no navegador
        if (customElements.get('motor-geometrico')) {
            setScriptCarregado(true);
            return;
        }

        // Se não foi registrado, cria e injeta a tag script dinamicamente da pasta public
        const script = document.createElement('script');
        script.src = '/motor-geometrico.js';
        script.async = true;
        
        script.onload = () => {
            console.log("🍃 Motor Geométrico 3D registrado com sucesso!");
            setScriptCarregado(true);
        };

        script.onerror = () => {
            console.error("❌ Erro ao carregar o arquivo motor-geometrico.js da pasta public.");
        };

        document.head.appendChild(script);

        return () => {
            // Limpeza opcional se necessário, mas mantemos o elemento registrado globalmente
        };
    }, []);

    // Se o script ainda estiver carregando, mostra um feedback visual amigável
    if (!scriptCarregado) {
        return (
            <div className="motor-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E2E8F0', color: '#4A5568', fontWeight: 'bold' }}>
                🔄 Inicializando Ambiente Gráfico 3D...
            </div>
        );
    }

    return (
        <div className="motor-container">
            <motor-geometrico 
                largura={String(largura)} 
                altura={String(altura)} 
                profundidade={String(profundidade)}
            ></motor-geometrico>
        </div>
    );
}