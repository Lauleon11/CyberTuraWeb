# CyberTura Web · Centro de mando

Panel web **de solo lectura** para ver los datos que la app Android de CyberTura guarda en Cloud Firestore. Está hecho con React, TypeScript y Vite, y usa los colores, los mundos, las insignias y los personajes del juego.

Es un repositorio independiente de `CyberTuraApp`; las dos carpetas son hermanas.

## Ejecutar

```bash
npm install
npm run setup
npm run dev
```

El panel queda en <http://localhost:5173>.

`npm run setup` genera `.env.local`, que git ignora. Toma la conexión a Firebase de `../CyberTuraApp/app/google-services.json` y te pide el usuario y la contraseña del administrador. Si dejas la contraseña vacía, genera una y la anota en un comentario de `.env.local`.

Para cambiar la contraseña, vuelve a ejecutar `npm run setup` y reinicia el servidor.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Revisa los tipos y compila en `dist/` |
| `npm test` | Ejecuta las pruebas de cálculos y de solo lectura |

## Secciones

- **Centro de mando:** progreso global, salud de los enemigos, podio, insignias y perfil del escuadrón.
- **Mundos:** cuántos héroes abren y completan cada mundo, con tiempos y errores por actividad.
- **Héroes:** registro con búsqueda y expediente individual.
- **Encuesta:** promedio por pregunta y comentarios.

Los datos se actualizan en vivo mientras el panel está abierto.

## Datos que lee

| Ruta en Firestore | Contenido |
|---|---|
| `players/{id}` | Perfil, puntaje y métricas de actividades |
| `players/{id}/worlds/{n}` | Estado de cada mundo |
| `surveys/{id}` | Respuestas de la encuesta |

Reglas de cálculo:

- Un tiempo `0` significa que la actividad no se registró, así que no entra en los promedios.
- La satisfacción se calcula con las respuestas, porque `averageStars` está truncado a entero.
- El rango de cada héroe (Recluta a Leyenda) y la salud de los enemigos son propios de este panel; no existen en la app.

## Solo lectura

Todo el acceso a Firebase está en `src/data/firestore.ts` y usa únicamente `onSnapshot`. `src/data/readonly.test.ts` falla si aparece una API de escritura o si otro archivo importa Firebase.

## Seguridad

El acceso de administrador se valida en el navegador porque el proyecto de Firebase no tiene Authentication habilitado. **Oculta el panel, pero no protege los datos:** las reglas actuales de Firestore permiten leer sin autenticación, y quien tenga la configuración del proyecto puede consultar los datos directamente.

Además, la contraseña debe ser fuerte: su hash va incluido en el código que se publica. El login necesita HTTPS o `localhost` para funcionar.

Para proteger los datos de verdad:

1. Habilita Firebase Authentication con correo y contraseña, y crea la cuenta del administrador.
2. Cambia `src/auth/auth.ts` para usar `signInWithEmailAndPassword`.
3. Ajusta las reglas de Firestore para que solo el administrador pueda leer y la app pueda seguir escribiendo.
