from django.shortcuts import render, redirect
from django.http import HttpResponse


def home(request):
    """Vista de bienvenida en la raíz del proyecto"""
    html = """
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TINCHO Barbería - API</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .container {
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                max-width: 600px;
                width: 100%;
                padding: 40px;
            }
            h1 {
                color: #333;
                margin-bottom: 10px;
                font-size: 2.5em;
            }
            h2 {
                color: #666;
                margin-bottom: 30px;
                font-weight: 300;
            }
            .links {
                display: flex;
                flex-direction: column;
                gap: 15px;
                margin-top: 30px;
            }
            .link-card {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
                border-radius: 10px;
                text-decoration: none;
                color: white;
                transition: transform 0.3s, box-shadow 0.3s;
                display: flex;
                align-items: center;
                gap: 15px;
            }
            .link-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            .icon {
                font-size: 2em;
                width: 60px;
                text-align: center;
            }
            .link-content h3 {
                margin-bottom: 5px;
                font-size: 1.2em;
            }
            .link-content p {
                opacity: 0.9;
                font-size: 0.9em;
            }
            .info {
                background: #f8f9fa;
                border-left: 4px solid #667eea;
                padding: 15px;
                margin-top: 30px;
                border-radius: 5px;
            }
            .info h4 {
                color: #667eea;
                margin-bottom: 10px;
            }
            .info ul {
                list-style: none;
                padding-left: 0;
            }
            .info li {
                padding: 5px 0;
                color: #666;
            }
            .info li:before {
                content: "✓ ";
                color: #10b981;
                font-weight: bold;
                margin-right: 8px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>✂️ TINCHO Barbería</h1>
            <h2>Sistema de Gestión de Turnos</h2>
            
            <div class="links">
                <a href="/admin/" class="link-card">
                    <div class="icon">🔐</div>
                    <div class="link-content">
                        <h3>Panel de Administración</h3>
                        <p>Gestiona barberos, servicios y turnos</p>
                    </div>
                </a>
                
                <a href="/api/" class="link-card">
                    <div class="icon">🔌</div>
                    <div class="link-content">
                        <h3>API REST</h3>
                        <p>Endpoints para barberos, servicios y turnos</p>
                    </div>
                </a>
            </div>
            
            <div class="info">
                <h4>📊 Estado del Sistema</h4>
                <ul>
                    <li>Django 5.0 + REST Framework</li>
                    <li>Base de datos configurada</li>
                    <li>CORS habilitado para React</li>
                    <li>Servidor de desarrollo activo</li>
                </ul>
            </div>
        </div>
    </body>
    </html>
    """
    return HttpResponse(html)
