# Configuración del Bot de Telegram para Notificaciones

Este documento explica cómo configurar el bot de Telegram para recibir notificaciones automáticas de la aplicación Club Cuotas.

## Eventos Notificados

El bot enviará notificaciones cuando ocurran los siguientes eventos:

1. **🆕 Nuevo Usuario Registrado**: Cuando un usuario se registra por primera vez en la aplicación
2. **🔗 Usuario Asociado a Jugador**: Cuando un usuario se vincula a un perfil de jugador existente
3. **💰 Pago Pendiente de Aprobación**: Cuando un jugador envía un comprobante de pago que necesita ser aprobado

## Paso 1: Crear el Bot en Telegram

1. Abre Telegram y busca el usuario **@BotFather**
2. Inicia una conversación y envía el comando `/newbot`
3. Sigue las instrucciones:
   - Ingresa un **nombre** para tu bot (ej: "Club Cuotas Notificaciones")
   - Ingresa un **username** único que termine en "bot" (ej: "clubcuotas_bot")
4. BotFather te responderá con un **token** que se ve así:
   ```
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
5. **Guarda este token** - lo necesitarás para la variable `TELEGRAM_BOT_TOKEN`

### Configuración Adicional del Bot (Opcional)

Puedes personalizar tu bot con estos comandos de BotFather:

- `/setdescription` - Establecer una descripción
- `/setabouttext` - Texto "Acerca de"
- `/setuserpic` - Foto de perfil del bot

## Paso 2: Obtener el Chat ID

Tienes varias opciones para recibir las notificaciones:

### Opción A: Recibir notificaciones en un grupo

1. Crea un grupo de Telegram o usa uno existente
2. Añade tu bot al grupo (busca @tu_bot_username y agrégalo)
3. Envía cualquier mensaje en el grupo
4. Visita esta URL en tu navegador (reemplaza `TU_TOKEN`):
   ```
   https://api.telegram.org/botTU_TOKEN/getUpdates
   ```
5. Busca el campo `"chat":{"id":` - el número que aparece (generalmente negativo para grupos) es tu **Chat ID**
   ```json
   "chat": {
     "id": -1001234567890,
     "title": "Nombre del Grupo"
   }
   ```

### Opción B: Recibir notificaciones personalmente

1. Busca tu bot en Telegram y envíale el comando `/start`
2. Visita esta URL en tu navegador (reemplaza `TU_TOKEN`):
   ```
   https://api.telegram.org/botTU_TOKEN/getUpdates
   ```
3. Busca tu Chat ID personal en la respuesta:
   ```json
   "chat": {
     "id": 123456789,
     "first_name": "Tu Nombre"
   }
   ```

### Método Alternativo: Usar @userinfobot

1. Busca **@userinfobot** en Telegram
2. Envíale cualquier mensaje
3. Te responderá con tu ID de usuario

## Paso 3: Configurar las Variables de Entorno

Añade las siguientes variables a tu archivo `.env`:

```env
# Token del bot de Telegram (de BotFather)
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# ID del chat donde se enviarán las notificaciones
# Para grupos: número negativo (ej: -1001234567890)
# Para usuarios individuales: número positivo (ej: 123456789)
TELEGRAM_CHAT_ID=-1001234567890
```

## Paso 4: Verificar la Configuración

Una vez configuradas las variables, puedes probar que todo funcione correctamente:

### Desde la API (requiere ser administrador)

```bash
# Verificar estado
curl -X GET http://localhost:3000/api/admin/configuracion/telegram

# Enviar mensaje de prueba
curl -X POST http://localhost:3000/api/admin/configuracion/telegram
```

### Respuestas esperadas

**GET** - Verificar estado:

```json
{
  "configurado": true,
  "tokenPresente": true,
  "chatIdPresente": true
}
```

**POST** - Enviar prueba:

```json
{
  "success": true,
  "mensaje": "Mensaje de prueba enviado correctamente"
}
```

## Solución de Problemas

### El bot no envía mensajes

1. **Verifica el token**: Asegúrate de que el token esté completo y sin espacios
2. **Verifica el Chat ID**: Asegúrate de que el ID sea correcto
3. **Para grupos**: El bot debe estar añadido al grupo
4. **Para usuarios**: Debes haber iniciado conversación con el bot (`/start`)

### Error "Chat not found"

- El Chat ID es incorrecto
- El bot fue removido del grupo
- No has iniciado conversación con el bot

### Las notificaciones llegan pero no se ven en el grupo

- Verifica que el bot tenga permisos para enviar mensajes en el grupo
- En grupos con restricciones, un administrador debe dar permisos al bot

## Desactivar Notificaciones

Si deseas desactivar temporalmente las notificaciones, simplemente elimina o comenta las variables de entorno:

```env
# TELEGRAM_BOT_TOKEN=...
# TELEGRAM_CHAT_ID=...
```

La aplicación funcionará normalmente sin enviar notificaciones.

## Seguridad

- **Nunca compartas** el token de tu bot públicamente
- **No commitees** el archivo `.env` a control de versiones
- Considera usar un grupo privado para las notificaciones
- El bot solo envía mensajes, no puede leer mensajes del grupo

## Formato de los Mensajes

Los mensajes utilizan formato HTML de Telegram:

- **Negrita**: `<b>texto</b>`
- _Cursiva_: `<i>texto</i>`
- Emojis para identificar rápidamente cada tipo de notificación
