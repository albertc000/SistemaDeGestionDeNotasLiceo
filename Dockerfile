# Imagen base ligera con Node.js 20 LTS
FROM node:20-alpine

# Directorio de trabajo en el contenedor
WORKDIR /app

# Copiar archivos de definición de dependencias
COPY package*.json ./

# Instalar dependencias del proyecto
RUN npm install

# Copiar el resto del código del proyecto
COPY . .

# Exponer el puerto de la aplicación Express
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
