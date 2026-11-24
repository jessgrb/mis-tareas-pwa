/* ==========================================================
   Mis Tareas — Lista de tareas con prioridades (PWA)
   Los datos se guardan en localStorage del navegador.
   ========================================================== */

const CLAVE_STORAGE = 'mis-tareas';
const ORDEN_PRIORIDAD = { alta: 0, media: 1, baja: 2 };

let tareas = cargarTareas();
let filtroActual = 'todas';

/* ---------- localStorage ---------- */
function cargarTareas() {
  try {
    const datos = localStorage.getItem(CLAVE_STORAGE);
    return datos ? JSON.parse(datos) : [];
  } catch (e) {
    console.error('No se pudieron leer las tareas:', e);
    return [];
  }
}

function guardarTareas() {
  try {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(tareas));
  } catch (e) {
    console.error('No se pudieron guardar las tareas:', e);
    mostrarAviso('Error al guardar');
  }
}

/* ---------- Navegación entre pantallas ---------- */
const pantallasValidas = ['pendientes', 'agregar', 'completadas'];

function mostrarPantalla() {
  const id = location.hash.replace('#', '');
  const pantalla = pantallasValidas.includes(id) ? id : 'pendientes';

  document.querySelectorAll('.pantalla').forEach(s =>
    s.classList.toggle('activa', s.id === pantalla));
  document.querySelectorAll('.nav-item').forEach(a =>
    a.classList.toggle('activo', a.dataset.pantalla === pantalla));

  if (pantalla === 'agregar') document.getElementById('titulo').focus();
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', mostrarPantalla);

/* ---------- Render ---------- */
function formatearFecha(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

function estaVencida(iso) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d) < hoy;
}

function crearElementoTarea(tarea) {
  const li = document.createElement('li');
  li.className = `tarea ${tarea.prioridad}${tarea.completada ? ' hecha' : ''}`;

  const check = document.createElement('input');
  check.type = 'checkbox';
  check.checked = tarea.completada;
  check.setAttribute('aria-label', tarea.completada ? 'Marcar como pendiente' : 'Marcar como completada');
  check.addEventListener('change', () => alternarTarea(tarea.id));

  const info = document.createElement('div');
  info.className = 'tarea-info';

  const titulo = document.createElement('p');
  titulo.className = 'tarea-titulo';
  titulo.textContent = tarea.titulo;
  info.appendChild(titulo);

  if (tarea.descripcion) {
    const desc = document.createElement('p');
    desc.className = 'tarea-desc';
    desc.textContent = tarea.descripcion;
    info.appendChild(desc);
  }

  const meta = document.createElement('div');
  meta.className = 'tarea-meta';
  const etiqueta = document.createElement('span');
  etiqueta.className = `etiqueta ${tarea.prioridad}`;
  etiqueta.textContent = tarea.prioridad;
  meta.appendChild(etiqueta);

  if (tarea.fecha) {
    const fecha = document.createElement('span');
    const vencida = !tarea.completada && estaVencida(tarea.fecha);
    fecha.className = 'fecha-limite' + (vencida ? ' vencida' : '');
    fecha.textContent = (vencida ? 'Vencida: ' : 'Límite: ') + formatearFecha(tarea.fecha);
    meta.appendChild(fecha);
  }
  info.appendChild(meta);

  const borrar = document.createElement('button');
  borrar.className = 'btn-borrar';
  borrar.setAttribute('aria-label', 'Eliminar tarea');
  borrar.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  borrar.addEventListener('click', () => eliminarTarea(tarea.id));

  li.append(check, info, borrar);
  return li;
}

function render() {
  const listaP = document.getElementById('lista-pendientes');
  const listaC = document.getElementById('lista-completadas');
  listaP.innerHTML = '';
  listaC.innerHTML = '';

  const pendientes = tareas
    .filter(t => !t.completada)
    .filter(t => filtroActual === 'todas' || t.prioridad === filtroActual)
    .sort((a, b) => ORDEN_PRIORIDAD[a.prioridad] - ORDEN_PRIORIDAD[b.prioridad] || a.creada - b.creada);

  const completadas = tareas
    .filter(t => t.completada)
    .sort((a, b) => (b.completadaEn || 0) - (a.completadaEn || 0));

  pendientes.forEach(t => listaP.appendChild(crearElementoTarea(t)));
  completadas.forEach(t => listaC.appendChild(crearElementoTarea(t)));

  const vacioP = document.getElementById('vacio-pendientes');
  vacioP.hidden = pendientes.length > 0;
  vacioP.textContent = filtroActual === 'todas'
    ? 'No tienes tareas pendientes. Agrega una en la pestaña «Agregar».'
    : `No hay tareas pendientes con prioridad ${filtroActual}.`;

  document.getElementById('vacio-completadas').hidden = completadas.length > 0;
  document.getElementById('btn-limpiar').hidden = completadas.length === 0;

  const totalPendientes = tareas.filter(t => !t.completada).length;
  document.getElementById('resumen').textContent =
    `${totalPendientes} pendiente${totalPendientes === 1 ? '' : 's'} · ${completadas.length} completada${completadas.length === 1 ? '' : 's'}`;
}

/* ---------- Acciones ---------- */
function agregarTarea(datos) {
  tareas.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    titulo: datos.titulo,
    descripcion: datos.descripcion,
    prioridad: datos.prioridad,
    fecha: datos.fecha,
    completada: false,
    creada: Date.now()
  });
  guardarTareas();
  render();
}

function alternarTarea(id) {
  const tarea = tareas.find(t => t.id === id);
  if (!tarea) return;
  tarea.completada = !tarea.completada;
  tarea.completadaEn = tarea.completada ? Date.now() : null;
  guardarTareas();
  render();
  mostrarAviso(tarea.completada ? '¡Tarea completada!' : 'Tarea movida a pendientes');
}

function eliminarTarea(id) {
  tareas = tareas.filter(t => t.id !== id);
  guardarTareas();
  render();
  mostrarAviso('Tarea eliminada');
}

function limpiarCompletadas() {
  if (!confirm('¿Borrar todas las tareas completadas?')) return;
  tareas = tareas.filter(t => !t.completada);
  guardarTareas();
  render();
  mostrarAviso('Tareas completadas borradas');
}

/* ---------- Aviso (toast) ---------- */
let temporizadorAviso;
function mostrarAviso(texto) {
  const aviso = document.getElementById('aviso');
  aviso.textContent = texto;
  aviso.classList.add('visible');
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => aviso.classList.remove('visible'), 2200);
}

/* ---------- Eventos ---------- */
document.getElementById('form-tarea').addEventListener('submit', e => {
  e.preventDefault();
  const form = e.target;
  const titulo = form.titulo.value.trim();
  const error = document.getElementById('error-titulo');

  if (!titulo) {
    error.hidden = false;
    form.titulo.focus();
    return;
  }
  error.hidden = true;

  agregarTarea({
    titulo,
    descripcion: form.descripcion.value.trim(),
    prioridad: form.prioridad.value,
    fecha: form.fecha.value
  });

  form.reset();
  mostrarAviso('Tarea guardada');
  location.hash = '#pendientes';
});

document.getElementById('titulo').addEventListener('input', () => {
  document.getElementById('error-titulo').hidden = true;
});

document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    filtroActual = chip.dataset.filtro;
    document.querySelectorAll('.chip').forEach(c => c.classList.toggle('activo', c === chip));
    render();
  });
});

document.getElementById('btn-limpiar').addEventListener('click', limpiarCompletadas);

/* ---------- Instalación (botón propio) ---------- */
let eventoInstalacion = null;
const btnInstalar = document.getElementById('btn-instalar');

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  eventoInstalacion = e;
  btnInstalar.hidden = false;
});

btnInstalar.addEventListener('click', async () => {
  if (!eventoInstalacion) return;
  eventoInstalacion.prompt();
  await eventoInstalacion.userChoice;
  eventoInstalacion = null;
  btnInstalar.hidden = true;
});

window.addEventListener('appinstalled', () => {
  btnInstalar.hidden = true;
  mostrarAviso('¡App instalada!');
});

/* ---------- Registro del Service Worker ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => console.log('Service Worker registrado. Alcance:', reg.scope))
      .catch(err => console.error('Error al registrar el Service Worker:', err));
  });
}

window.addEventListener('offline', () => mostrarAviso('Sin conexión: la app sigue funcionando'));
window.addEventListener('online', () => mostrarAviso('Conexión restablecida'));

/* ---------- Inicio ---------- */
mostrarPantalla();
render();
