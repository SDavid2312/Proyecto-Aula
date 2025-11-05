import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import session from 'express-session';
import { db } from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Sesión
app.use(session({
  secret: 'timecontrol-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 30 }
}));

// Middlewares
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }));
app.use(express.json());
app.disable('x-powered-by');

// Archivos estáticos
app.use('/css', express.static(path.join(__dirname, '../Fronted/css')));
app.use('/js', express.static(path.join(__dirname, '../Fronted/js')));
app.use('/html', express.static(path.join(__dirname, '../Fronted/html')));

// Página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Fronted/html/login.html'));
});

// Login
app.post('/login', async (req, res) => {
  const { correo, contraseña } = req.body;
  if (!correo || !contraseña)
    return res.status(400).json({ msg: 'Faltan campos' });

  try {
    const [rows] = await db.query('SELECT * FROM empleados WHERE correo = ?', [correo]);
    if (rows.length === 0) return res.status(400).json({ msg: 'Empleado no encontrado' });

    const empleado = rows[0];
    const match = await bcrypt.compare(contraseña, empleado.contraseña);
    if (!match) return res.status(401).json({ msg: 'Contraseña incorrecta' });

    req.session.user = {
      id: empleado.id,
      nombre: empleado.nombre,
      correo: empleado.correo,
      cargo: empleado.cargo
    };

    const destino = empleado.cargo === 'RRHH' ? '/html/rrhh.html' : '/html/empleado.html';

    res.status(200).json({
      msg: 'Login exitoso',
      destino,
      usuario: req.session.user
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ msg: 'Error en el servidor', error });
  }
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ msg: 'Error al cerrar sesión' });
    res.clearCookie('connect.sid');
    res.json({ msg: 'Sesión cerrada correctamente' });
  });
});

// Registro de empleados
app.post('/api/register', async (req, res) => {
  const { nombre, correo, contraseña } = req.body;
  const cargo = req.body.cargo || 'empleado';

  if (!nombre || !correo || !contraseña)
    return res.status(400).json({ msg: 'Faltan campos obligatorios' });

  try {
    const hashed = await bcrypt.hash(contraseña, 10);
    await db.query(
      'INSERT INTO empleados (nombre, correo, cargo, contraseña) VALUES (?, ?, ?, ?)',
      [nombre, correo, cargo, hashed]
    );
    res.json({ msg: 'Empleado registrado correctamente' });
  } catch (error) {
    console.error('Error al registrar empleado:', error);
    res.status(500).json({ msg: 'Error al registrar empleado', error });
  }
});

// Obtener empleados
app.get('/api/empleados', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nombre, correo, cargo FROM empleados');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    res.status(500).json({ msg: 'Error al obtener empleados', error });
  }
});

// Obtener empleado por ID
app.get('/api/empleados/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT id, nombre, correo, cargo FROM empleados WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ msg: 'Empleado no encontrado' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener empleado:', error);
    res.status(500).json({ msg: 'Error al obtener empleado', error });
  }
});

// Agregar empleado
app.post('/api/empleados', async (req, res) => {
  const { nombre, correo, contraseña, cargo } = req.body;
  if (!nombre || !correo || !contraseña || !cargo)
    return res.status(400).json({ msg: 'Faltan campos obligatorios' });

  try {
    const hashed = await bcrypt.hash(contraseña, 10);
    await db.query(
      'INSERT INTO empleados (nombre, correo, cargo, contraseña) VALUES (?, ?, ?, ?)',
      [nombre, correo, cargo, hashed]
    );
    res.json({ msg: 'Empleado agregado correctamente' });
  } catch (error) {
    console.error('Error al agregar empleado:', error);
    res.status(500).json({ msg: 'Error al agregar empleado', error });
  }
});

// Actualizar empleado
app.put('/empleados/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, correo, cargo, contraseña } = req.body;
  if (!nombre || !correo || !cargo)
    return res.status(400).json({ msg: 'Faltan campos obligatorios' });

  try {
    if (contraseña && contraseña.trim() !== '') {
      const hashed = await bcrypt.hash(contraseña, 10);
      await db.query(
        'UPDATE empleados SET nombre = ?, correo = ?, cargo = ?, contraseña = ? WHERE id = ?',
        [nombre, correo, cargo, hashed, id]
      );
    } else {
      await db.query(
        'UPDATE empleados SET nombre = ?, correo = ?, cargo = ? WHERE id = ?',
        [nombre, correo, cargo, id]
      );
    }
    res.json({ msg: 'Empleado actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar empleado:', error);
    res.status(500).json({ msg: 'Error al actualizar empleado', error });
  }
});

// Eliminar empleado
app.delete('/api/empleados/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM asistencias WHERE empleado_id = ?', [id]);
    const [result] = await db.query('DELETE FROM empleados WHERE id = ?', [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ msg: 'Empleado no encontrado' });
    res.json({ msg: 'Empleado eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar empleado:', error.message);
    res.status(500).json({ msg: 'Error al eliminar empleado', error: error.message });
  }
});

// Check-in
app.post('/api/asistencia/checkin', async (req, res) => {
  const { empleado_id } = req.body;
  if (!empleado_id) return res.status(400).json({ msg: 'Faltan campos obligatorios' });

  try {
    await db.query(
      'INSERT INTO asistencias (empleado_id, fecha, hora_entrada) VALUES (?, CURDATE(), CURTIME())',
      [empleado_id]
    );
    res.json({ msg: 'Entrada registrada correctamente' });
  } catch (error) {
    console.error('Error al registrar entrada:', error);
    res.status(500).json({ msg: 'Error al registrar entrada', error });
  }
});

// Check-out
app.post('/api/asistencia/checkout', async (req, res) => {
  const { empleado_id } = req.body;
  if (!empleado_id) return res.status(400).json({ msg: 'Faltan campos obligatorios' });

  try {
    const [rows] = await db.query(
      `SELECT id FROM asistencias
       WHERE empleado_id = ? AND hora_salida IS NULL
       ORDER BY id DESC LIMIT 1`,
      [empleado_id]
    );

    if (rows.length === 0)
      return res.status(400).json({ msg: 'No hay asistencia pendiente por cerrar' });

    const asistenciaId = rows[0].id;

    await db.query(
      `UPDATE asistencias
       SET hora_salida = CURTIME(),
           horas_trabajadas = TIMEDIFF(CURTIME(), hora_entrada)
       WHERE id = ?`,
      [asistenciaId]
    );

    res.json({ msg: 'Salida registrada correctamente' });
  } catch (error) {
    console.error('Error al registrar salida:', error);
    res.status(500).json({ msg: 'Error al registrar salida', error });
  }
});

// Obtener asistencias con filtros opcionales
app.get('/api/asistencias', async (req, res) => {
  const { cargo, empleado_id, fechaInicio, fechaFin } = req.query;

  try {
    let query = `
      SELECT a.id, e.nombre, e.correo, a.fecha, a.hora_entrada, a.hora_salida, a.horas_trabajadas
      FROM asistencias a
      JOIN empleados e ON a.empleado_id = e.id
    `;

    const condiciones = [];
    const params = [];

    if (cargo !== 'RRHH' && empleado_id) {
      condiciones.push('e.id = ?');
      params.push(empleado_id);
    }

    if (fechaInicio && fechaFin) {
      condiciones.push('a.fecha BETWEEN ? AND ?');
      params.push(fechaInicio, fechaFin);
    } else if (fechaInicio) {
      condiciones.push('a.fecha >= ?');
      params.push(fechaInicio);
    } else if (fechaFin) {
      condiciones.push('a.fecha <= ?');
      params.push(fechaFin);
    }

    if (condiciones.length > 0) {
      query += ' WHERE ' + condiciones.join(' AND ');
    }

    query += ' ORDER BY a.fecha DESC';

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener asistencias:', error);
    res.status(500).json({ msg: 'Error al obtener asistencias', error });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
