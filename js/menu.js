        // Navegación entre secciones
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', function() {
                // Remover clase active de todos los elementos
                document.querySelectorAll('.menu-item').forEach(i => {
                    i.classList.remove('active');
                });
                
                // Agregar clase active al elemento clickeado
                this.classList.add('active');
                
                // Ocultar todas las secciones
                document.querySelectorAll('.content-area').forEach(section => {
                    section.classList.add('hidden');
                });
                
                // Mostrar la sección correspondiente
                const target = this.getAttribute('data-target');
                document.getElementById(target).classList.remove('hidden');
                
                // Actualizar título de página
                document.getElementById('page-title').textContent = this.textContent.trim();
            });
        });
        
        // Mostrar/ocultar formularios
        document.getElementById('btn-nueva-bodega').addEventListener('click', function() {
            document.getElementById('form-bodega').classList.remove('hidden');
        });
        
        document.getElementById('btn-cancelar-bodega').addEventListener('click', function() {
            document.getElementById('form-bodega').classList.add('hidden');
        });
        
        document.getElementById('btn-nuevo-producto').addEventListener('click', function() {
            document.getElementById('form-producto').classList.remove('hidden');
        });
        
        document.getElementById('btn-cancelar-producto').addEventListener('click', function() {
            document.getElementById('form-producto').classList.add('hidden');
        });
        
        document.getElementById('btn-nuevo-movimiento').addEventListener('click', function() {
            document.getElementById('form-movimiento').classList.remove('hidden');
        });
        
        document.getElementById('btn-cancelar-movimiento').addEventListener('click', function() {
            document.getElementById('form-movimiento').classList.add('hidden');
        });