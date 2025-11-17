# 📦 Sistema de Gestión y Auditoría de Bodegas — LogiTrack S.A.

Sistema backend desarrollado con **Spring Boot** para administrar bodegas, productos, movimientos de inventario y auditorías automáticas, garantizando trazabilidad, seguridad y control centralizado.

---

## 🚀 Objetivo General

Implementar un sistema que permita:

- Gestionar bodegas y productos.
- Registrar y controlar movimientos de inventario.
- Guardar auditorías automáticas de cambios.
- Proteger la información mediante **JWT + Spring Security**.
- Exponer una API REST documentada con **Swagger/OpenAPI**.

---

## 🧩 Características Principales

- Gestión completa de bodegas, productos y movimientos.
- Auditoría de todos los cambios (INSERT, UPDATE, DELETE).
- Seguridad mediante JWT, roles y filtros.
- Endpoints avanzados para reportes y consultas.
- Documentación automática con Swagger.
- Manejo global de excepciones.
- Base de datos MySQL configurada.

---

## 📁 Estructura del Proyecto


src/
 ├── config/
 ├── controller/
 ├── service/
 ├── repository/
 ├── model/
 ├── security/
 ├── exception/
 ├── util/

# 🗄️ Modelado del Sistema

## 1. 🏬 Gestión de Bodegas

### Entidad **Bodega**
- id  
- nombre  
- ubicacion  
- capacidad  
- encargado  

### Operaciones
- Crear  
- Consultar  
- Actualizar  
- Eliminar  

---

## 2. 📦 Gestión de Productos

### Entidad **Producto**
- id  
- nombre  
- categoria  
- stock  
- precio  

CRUD completo disponible.

---

## 3. 🔄 Movimientos de Inventario

### Tipos  
`ENTRADA`, `SALIDA`, `TRANSFERENCIA`

### Entidad **Movimiento**
- id  
- fecha  
- tipoMovimiento  
- usuarioResponsable  
- bodegaOrigen  
- bodegaDestino  
- lista de productos con cantidades  

---

## 4. 📝 Auditoría de Cambios

### Entidad **Auditoria**
- id  
- tipoOperacion (INSERT / UPDATE / DELETE)  
- fechaHora  
- usuario  
- entidadAfectada  
- valoresAnteriores  
- valoresNuevos  

### Implementación
- JPA EntityListeners  
- **o** AOP (Aspect-Oriented Programming)  

---

## 5. 🔐 Autenticación y Seguridad

### Endpoints públicos
POST /auth/login
POST /auth/register

Endpoints protegidos
/bodegas/**
/productos/**
/movimientos/**
/auditoria/**


### Roles
- **ADMIN**
- **EMPLEADO**

### Seguridad basada en
- Spring Security  
- JWT Token Filter  
- AuthenticationProvider  

---

## 6. 📊 Consultas Avanzadas y Reportes

### ✔ Productos con stock bajo (< 10)

GET /productos/stock-bajo

### ✔ Movimientos por rango de fechas

GET /movimientos?inicio=2024-01-01&fin=2024-01-31

### ✔ Auditorías filtradas
GET /auditoria?usuario=juan
GET /auditoria?tipo=UPDATE

### ✔ Reporte general

GET /reportes/resumen

Retorna:

{
  "stockTotalPorBodega": [...],
  "productosMasMovidos": [...]
}

### ⚠️ Manejo de Excepciones
Incluye:

@ControllerAdvice

### Errores personalizados:

400: Bad Request

401: Unauthorized

404: Not Found

500: Internal Server Error

Validaciones:

@NotNull

@Size

@Min

@Valid para DTOs

## 📘 Documentación Swagger

Se habilita en:

/swagger-ui.html


o

/swagger-ui/index.html


Configurado con OpenAPI 3.

### 🛢️ Configuración MySQL

src/main/resources/application.properties:

spring.datasource.url=jdbc:mysql://localhost:3306/logitrack
spring.datasource.username=root
spring.datasource.password=1234
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true


Incluye:

schema.sql

data.sql (opcional)

### ▶️ Ejecución

Tener Java 17+ instalado.

Crear la base de datos:

CREATE DATABASE logitrack;


Clonar el proyecto:

git clone https://github.com/tu-repo/logitrack.git


Ejecutar:

mvn spring-boot:run


### 🌐 Frontend Básico

Incluye HTML/CSS/JS para:

Login con JWT

Consultar bodegas

Consultar productos

Ver reportes principales

## 📡 Ejemplos de Endpoints
Login
POST /auth/login
{
  "username": "admin",
  "password": "1234"
}

Registrar Bodega
POST /bodegas
Authorization: Bearer <token>

{
  "nombre": "Bodega Norte",
  "ubicacion": "Bogotá",
  "capacidad": 500,
  "encargado": "Carlos Ruiz"
}

Movimiento de Inventario
POST /movimientos
{
  "tipo": "TRANSFERENCIA",
  "bodegaOrigen": 1,
  "bodegaDestino": 2,
  "productos": [
    { "id": 5, "cantidad": 20 }
  ]
}

📄 Licencia

Proyecto interno para LogiTrack S.A. – Uso corporativo.