const fs = require('node:fs');

fs.readFile('routes.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Error al leer el archivo:', err);
        return;
    }

    try {
        const rutas = JSON.parse(data);
        //Iterar por cada clave
        let permisos = [];
        for (const clave in rutas) {
            if (rutas[clave].length > 0) {
                console.log("Permisos para la clave:", rutas[clave]);
                if (!permisos.includes(...rutas[clave])) {
                    permisos.push(...rutas[clave]);
                }
            }
        }
        console.log("Permisos únicos:", permisos);
        fs.writeFileSync('permisos.json', JSON.stringify(permisos, null, 2));

    } catch (error_) {
        console.error('Error al parsear JSON:', error_);
    }
});