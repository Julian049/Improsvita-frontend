# Improsvita Frontend

Frontend del proyecto Improsvita

## Estructura

```text
src/
├── api/                   # Cliente HTTP base y endpoints por entidad (*.api.js)
├── components/            # Componentes de la interfaz
│   ├── layout/            # Componentes de navegación
│   └── ui/                # Componentes reutilizables (DataTable, SearchBar)
├── context/               # Estado global de la aplicación
├── features/              # Módulos por dominio de negocio
│   ├── auth/              # Autenticación y acceso
│   ├── contactos/         # Clientes y proveedores
│   ├── plantulas/         # Monitoreo y disponibilidad de plántulas
│   ├── reservas/          # Control de reservas
│   ├── semillas/          # Inventario de semillas
│   ├── siembras/          # Ciclo de siembra y estados de cultivo
│   └── ventas/            # Ventas directas, comprobantes e historial
├── hooks/                 # Hooks globales reutilizables
├── router/                # Configuración de rutas
├── utils/                 # Utilidades compartidas
├── App.jsx                # Componente raíz
├── index.css              # Estilos
└── main.jsx               # Punto de entrada
```


## Ejecución

Instalar dependencias:

```bash
npm install
```

Ejecutar el proyecto:

```bash
npm run dev
```
