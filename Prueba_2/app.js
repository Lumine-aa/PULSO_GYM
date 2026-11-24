// ============================================================
// PULSO - Sistema de Gestión de Gimnasio
// Panel Ejecutivo del Dueño (admin) + Interfaces por rol
// ============================================================

const supabaseUrl = 'https://fgadawzqspannxtgqlve.supabase.co';
const supabaseKey = 'sb_publishable_19_KCaQ271AmrQ7lfGajEg_2Vmyl6Ww';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
const db = supabaseClient;

const $ = (id) => document.getElementById(id);
const loginContainer = $('login-container');
const dashboardContainer = $('dashboard-container');
const loginForm = $('login-form');
const loginError = $('login-error');
const logoutBtn = $('logout-btn');
const loginBtn = $('login-btn');
const passwordInput = $('password');
const togglePasswordBtn = $('toggle-password');

let perfil = null;
let vistaActual = null;
let cacheSocios = [];
let cachePlanes = [];
let cachePagosAdmin = [];
let cacheNovedades = [];

// ------------------------------------------------------------
// Iconos SVG
// ------------------------------------------------------------
const ICONS = {
    home: '<svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/></svg>',
    user: '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    users: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    cash: '<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/></svg>',
    shield: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    note: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    card: '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="3"/><line x1="2" y1="10" x2="22" y2="10"/></svg>',
    alert: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    pulse: '<svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    tag: '<svg viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
    bell: '<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
};

// ------------------------------------------------------------
// Utilidades y Componentes Visuales
// ------------------------------------------------------------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => '$ ' + Number(n || 0).toLocaleString('es-CO');
const moneyCorto = (n) => {
    const v = Number(n || 0);
    if (v >= 1_000_000) return '$' + (v / 1_000_000).toFixed(1).replace('.0', '') + 'M';
    if (v >= 1_000) return '$' + Math.round(v / 1_000) + 'k';
    return '$' + v;
};
const fechaHora = (d) => new Date(d).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
const soloHora = (d) => new Date(d).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
const dia = (d) => new Date(d).toLocaleDateString('en-CA');
const hoy = () => dia(new Date());
const masDias = (n) => dia(new Date(Date.now() + n * 864e5));
const badge = (txt, tipo) => ({ h: `<span class="badge ${tipo || ''}">${esc(txt)}</span>` });
const estadoClase = { Activa: 'ok', Registrado: 'ok', Vencida: 'warn', Cancelada: 'mal', Anulado: 'mal' };

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

async function q(promesa) {
    const r = await promesa;
    if (r.error) throw r.error;
    return r;
}

function toast(msg, tipo = 'ok') {
    const el = document.createElement('div');
    el.className = `toast ${tipo}`;
    el.textContent = msg;
    $('toast-container').appendChild(el);
    setTimeout(() => el.remove(), 3600);
}

function whatsappLink(telefono, nombre, fechaFin) {
    const digits = String(telefono || '').replace(/\D/g, '');
    if (!digits) return null;
    const num = digits.length === 10 ? '57' + digits : digits;
    const txt = fechaFin && fechaFin < hoy()
        ? `Hola ${nombre}, te saludamos de PULSO Entrenamiento Vital. Tu membresía venció el ${fechaFin}. ¡Te esperamos para renovarla y seguir entrenando!`
        : `Hola ${nombre}, te saludamos de PULSO Entrenamiento Vital. Te recordamos que tu plan vence pronto (${fechaFin}). ¡Nos vemos en el gym!`;
    return `https://wa.me/${num}?text=${encodeURIComponent(txt)}`;
}

function kpi(titulo, valor, sub, iconKey = 'pulse', tone = '') {
    return `<div class="kpi-card">
        <div class="kpi-top">
            <h3>${esc(titulo)}</h3>
            <span class="kpi-icon ${tone}">${ICONS[iconKey] || ICONS.pulse}</span>
        </div>
        <p class="kpi-value ${tone === 'err' ? 'alert-text' : tone === 'ok' ? 'ok-text' : tone === 'warn' ? 'warn-text' : ''}">${esc(valor)}</p>
        ${sub ? `<p class="kpi-sub">${esc(sub)}</p>` : ''}
    </div>`;
}

function barras(titulo, items, tone = '') {
    const max = Math.max(1, ...items.map((i) => i[1]));
    return `<div class="panel"><h3>${esc(titulo)}</h3><div class="barras">${items.map(([l, v, t]) =>
        `<div class="barra ${tone}"><span class="barra-v">${esc(t ?? v)}</span><i style="height:${(v / max) * 100}%"></i><span>${esc(l)}</span></div>`).join('')}</div></div>`;
}

function donutChart(titulo, entries) {
    const colors = ['#8ce8ff', '#4ade80', '#fbbf24', '#c084fc', '#f472b6'];
    const total = entries.reduce((s, [, v]) => s + Number(v), 0);
    if (!total) {
        return `<div class="panel"><h3>${esc(titulo)}</h3><p class="vacio">Sin datos registrados en este período.</p></div>`;
    }
    const r = 54;
    const circ = 2 * Math.PI * r;
    let offset = 0;
    const circles = entries.map(([, val], idx) => {
        const pct = Number(val) / total;
        const dash = pct * circ;
        const c = `<circle cx="77" cy="77" r="${r}" fill="none" stroke="${colors[idx % colors.length]}" stroke-width="18" stroke-dasharray="${dash} ${circ - dash}" stroke-dashoffset="${-offset}" />`;
        offset += dash;
        return c;
    }).join('');

    const legend = entries.map(([label, val, customVal], idx) => {
        const pct = Math.round((Number(val) / total) * 100);
        return `<div class="legend-item">
            <span class="legend-left"><i class="legend-dot" style="background:${colors[idx % colors.length]}"></i>${esc(label)}</span>
            <strong>${esc(customVal ?? `${money(val)} (${pct}%)`)}</strong>
        </div>`;
    }).join('');

    return `<div class="panel">
        <h3>${esc(titulo)}</h3>
        <div class="donut-wrap">
            <svg class="donut-svg" viewBox="0 0 154 154">
                <circle cx="77" cy="77" r="${r}" fill="none" stroke="#27272a" stroke-width="18" />
                ${circles}
            </svg>
            <div class="donut-legend">${legend}</div>
        </div>
    </div>`;
}

function heatmapHoras(titulo, asistencias) {
    const diasSem = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const franjas = [
        ['5am - 9am', 5, 9],
        ['9am - 12pm', 9, 12],
        ['12pm - 4pm', 12, 16],
        ['4pm - 7pm', 16, 19],
        ['7pm - 10pm', 19, 23],
    ];
    const counts = franjas.map(() => Array(7).fill(0));
    asistencias.forEach((a) => {
        const dt = new Date(a.fecha_hora_ingreso);
        const dow = (dt.getDay() + 6) % 7;
        const hr = dt.getHours();
        const fIdx = franjas.findIndex(([, ini, fin]) => hr >= ini && hr < fin);
        if (fIdx >= 0) counts[fIdx][dow]++;
    });
    const max = Math.max(1, ...counts.flat());

    let html = `<div class="panel"><h3>${esc(titulo)}</h3><div class="heatmap-grid"><div></div>`;
    diasSem.forEach((d) => { html += `<div class="hm-head">${d}</div>`; });
    franjas.forEach(([label], rIdx) => {
        html += `<div class="hm-label">${label}</div>`;
        counts[rIdx].forEach((val) => {
            const intensity = val === 0 ? 0.04 : 0.16 + (val / max) * 0.72;
            const color = val / max > 0.55 ? '#09090b' : '#ffffff';
            html += `<div class="hm-cell" style="background:rgba(140,232,255,${intensity.toFixed(2)});color:${color}">${val || ''}</div>`;
        });
    });
    html += `</div></div>`;
    return html;
}

function tabla(titulo, cabeceras, filas, extraHeader = '') {
    const celda = (c) => (c && typeof c === 'object' ? c.h : esc(c));
    const cuerpo = filas.length
        ? filas.map((f) => `<tr>${f.map((c) => `<td>${celda(c)}</td>`).join('')}</tr>`).join('')
        : `<tr><td colspan="${cabeceras.length}" class="vacio">Sin registros disponibles.</td></tr>`;
    return `<div class="panel">
        ${titulo || extraHeader ? `<div class="panel-header"><h3>${esc(titulo)}</h3>${extraHeader}</div>` : ''}
        <table class="tabla"><thead><tr>${cabeceras.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${cuerpo}</tbody></table>
    </div>`;
}

function asistenciasPorDia(filas) {
    const items = [];
    for (let i = 6; i >= 0; i--) {
        const d = masDias(-i);
        items.push([d.slice(5), filas.filter((a) => dia(a.fecha_hora_ingreso) === d).length]);
    }
    return items;
}
const desde7dias = () => new Date(masDias(-6) + 'T00:00:00').toISOString();

async function cargarEstadoSocios() {
    const [socRes, memRes] = await Promise.all([
        q(db.from('socios').select('*').order('nombre_completo')),
        q(db.from('membresias').select('id, socio_id, plan_id, fecha_inicio, fecha_fin, estado, planes(nombre)').order('fecha_fin', { ascending: false })),
    ]);
    const ultMem = {};
    memRes.data.forEach((m) => {
        if (!ultMem[m.socio_id]) ultMem[m.socio_id] = m;
    });
    cacheSocios = socRes.data.map((s) => ({ ...s, membresia: ultMem[s.id] || null }));
    return cacheSocios;
}

function estadoMembresiaSocio(socio) {
    const m = socio.membresia;
    const d0 = hoy();
    if (!m) return { texto: 'Sin plan', tipo: 'mal', vencida: true, fechaFin: null, plan: 'Sin plan' };
    if (m.estado !== 'Activa' || m.fecha_fin < d0) {
        return { texto: `Vencida (${m.fecha_fin})`, tipo: 'mal', vencida: true, fechaFin: m.fecha_fin, plan: m.planes?.nombre || 'Plan' };
    }
    if (m.fecha_fin <= masDias(3)) {
        return { texto: `Vence ${m.fecha_fin}`, tipo: 'warn', vencida: false, porVencer: true, fechaFin: m.fecha_fin, plan: m.planes?.nombre || 'Plan' };
    }
    return { texto: `Activa hasta ${m.fecha_fin}`, tipo: 'ok', vencida: false, fechaFin: m.fecha_fin, plan: m.planes?.nombre || 'Plan' };
}

// Agrupador temporal reutilizable (Semana a semana, Mes a mes, Año a año)
function agruparSerieTemporal(registros, getFecha, getValor, modo = 'mes') {
    const ahora = new Date();
    const items = [];

    if (modo === 'semana') {
        // Últimas 8 semanas
        const diaSem = (ahora.getDay() + 6) % 7; // Lunes = 0
        const inicioSemanaActual = new Date(ahora);
        inicioSemanaActual.setHours(0, 0, 0, 0);
        inicioSemanaActual.setDate(ahora.getDate() - diaSem);

        for (let i = 7; i >= 0; i--) {
            const ini = new Date(inicioSemanaActual);
            ini.setDate(inicioSemanaActual.getDate() - i * 7);
            const fin = new Date(ini);
            fin.setDate(ini.getDate() + 7);
            const label = `${String(ini.getMonth() + 1).padStart(2, '0')}-${String(ini.getDate()).padStart(2, '0')}`;
            const suma = registros.reduce((acc, r) => {
                const f = new Date(getFecha(r));
                return f >= ini && f < fin ? acc + Number(getValor(r)) : acc;
            }, 0);
            items.push([label, suma]);
        }
    } else if (modo === 'anio') {
        const anioActual = ahora.getFullYear();
        const aniosSet = new Set([anioActual - 2, anioActual - 1, anioActual]);
        registros.forEach((r) => {
            const y = new Date(getFecha(r)).getFullYear();
            if (!isNaN(y)) aniosSet.add(y);
        });
        const anios = Array.from(aniosSet).sort((a, b) => a - b);
        anios.forEach((y) => {
            const suma = registros.reduce((acc, r) => {
                const f = new Date(getFecha(r));
                return f.getFullYear() === y ? acc + Number(getValor(r)) : acc;
            }, 0);
            items.push([String(y), suma]);
        });
    } else {
        // Mes a mes (últimos 6 meses)
        for (let i = 5; i >= 0; i--) {
            const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
            const y = d.getFullYear();
            const m = d.getMonth();
            const label = `${MESES_CORTOS[m]} ${String(y).slice(2)}`;
            const suma = registros.reduce((acc, r) => {
                const f = new Date(getFecha(r));
                return f.getFullYear() === y && f.getMonth() === m ? acc + Number(getValor(r)) : acc;
            }, 0);
            items.push([label, suma]);
        }
    }
    return items;
}

// ------------------------------------------------------------
// 1. VISTAS DE ADMINISTRADOR (DUEÑO DEL GIMNASIO)
// ------------------------------------------------------------
async function obtenerEquipoSafe() {
    try {
        const rpcRes = await db.rpc('listar_equipo');
        if (!rpcRes.error && Array.isArray(rpcRes.data)) return rpcRes.data;
    } catch (_) { /* fallback directo */ }

    try {
        const tblRes = await db.from('roles_empleados').select('*');
        if (!tblRes.error && Array.isArray(tblRes.data)) {
            return tblRes.data.map((r) => ({
                id: r.id,
                nombre: r.nombre || `Usuario (${String(r.id).slice(0, 6)})`,
                email: r.email || '—',
                rol: r.rol,
                activo: r.activo !== false,
            }));
        }
    } catch (_) { /* ignore */ }
    return [];
}

async function obtenerNovedadesSafe() {
    try {
        const res = await db.from('novedades_gym').select('*').order('created_at', { ascending: false }).limit(80);
        if (res.error) return { error: res.error, data: [] };
        cacheNovedades = res.data || [];
        return { error: null, data: cacheNovedades };
    } catch (err) {
        return { error: err, data: [] };
    }
}

// Estado "libre para entrenamiento". Devuelven valores seguros si las
// funciones de Supabase aún no existen (migración supabase-estado-libre.sql).
async function obtenerEstadoLibreSafe() {
    try {
        const res = await db.rpc('mi_estado_libre');
        return res.error || !Array.isArray(res.data) ? { ok: false, desde: null } : { ok: true, desde: res.data };
    } catch (_) {
        return { ok: false, desde: null };
    }
}

async function sociosLibresSafe() {
    try {
        const res = await db.rpc('socios_libres_hoy');
        return res.error || !Array.isArray(res.data) ? null : res.data;
    } catch (_) {
        return null;
    }
}

function renderGraficaIngresosAdmin(modo = 'mes') {
    const items = agruparSerieTemporal(cachePagosAdmin, (p) => p.fecha_pago, (p) => p.monto_total, modo);
    const totalPeriodo = items.reduce((s, [, v]) => s + v, 0);
    const max = Math.max(1, ...items.map((i) => i[1]));
    const titulos = {
        semana: 'Evolución de ingresos (Semana a semana)',
        mes: 'Evolución de ingresos (Mes a mes)',
        anio: 'Evolución de ingresos (Año a año)',
    };

    return `<div class="panel-header">
            <div>
                <h3>${titulos[modo]}</h3>
                <p class="kpi-sub">Total en el período visible: <strong style="color:var(--ok)">${money(totalPeriodo)}</strong></p>
            </div>
            <div class="period-tabs">
                <button type="button" class="period-tab ${modo === 'semana' ? 'active' : ''}" data-ingresos-modo="semana">Semana</button>
                <button type="button" class="period-tab ${modo === 'mes' ? 'active' : ''}" data-ingresos-modo="mes">Mes</button>
                <button type="button" class="period-tab ${modo === 'anio' ? 'active' : ''}" data-ingresos-modo="anio">Año</button>
            </div>
        </div>
        <div class="barras">
            ${items.map(([lbl, val]) => `<div class="barra green">
                <span class="barra-v">${moneyCorto(val)}</span>
                <i style="height:${(val / max) * 100}%"></i>
                <span>${esc(lbl)}</span>
            </div>`).join('')}
        </div>`;
}

async function inicioAdmin() {
    const d0 = hoy();
    const mesActual = d0.slice(0, 7); // AAAA-MM
    const dtMesAnt = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    const mesAnterior = `${dtMesAnt.getFullYear()}-${String(dtMesAnt.getMonth() + 1).padStart(2, '0')}`;

    const [sociosList, pagosRes, asis30, equipo, novRes] = await Promise.all([
        cargarEstadoSocios(),
        q(db.from('pagos').select('id, monto_total, metodo_pago, fecha_pago, estado, membresias(planes(nombre))').eq('estado', 'Registrado').order('fecha_pago', { ascending: true })),
        q(db.from('asistencias').select('fecha_hora_ingreso').gte('fecha_hora_ingreso', new Date(masDias(-30) + 'T00:00:00').toISOString())),
        obtenerEquipoSafe(),
        obtenerNovedadesSafe(),
    ]);

    cachePagosAdmin = pagosRes.data || [];

    const pagosMes = cachePagosAdmin.filter((p) => dia(p.fecha_pago).startsWith(mesActual));
    const pagosMesAnt = cachePagosAdmin.filter((p) => dia(p.fecha_pago).startsWith(mesAnterior));
    const pagosHoy = cachePagosAdmin.filter((p) => dia(p.fecha_pago) === d0);

    const totalMes = pagosMes.reduce((s, p) => s + Number(p.monto_total), 0);
    const totalMesAnt = pagosMesAnt.reduce((s, p) => s + Number(p.monto_total), 0);
    const totalHoy = pagosHoy.reduce((s, p) => s + Number(p.monto_total), 0);

    let subMes = `${pagosMes.length} pagos este mes`;
    if (totalMesAnt > 0) {
        const diffPct = Math.round(((totalMes - totalMesAnt) / totalMesAnt) * 100);
        subMes += ` (${diffPct >= 0 ? '+' : ''}${diffPct}% vs mes ant.)`;
    }

    const activos = sociosList.filter((s) => !estadoMembresiaSocio(s).vencida).length;
    const staffActivo = equipo.filter((e) => e.activo && (e.rol === 'recepcion' || e.rol === 'entrenador')).length;
    const novSinResolver = novRes.data.filter((n) => n.estado !== 'Resuelta').length;

    // Ingresos del mes por método de pago
    const porMetodo = {};
    pagosMes.forEach((p) => { porMetodo[p.metodo_pago] = (porMetodo[p.metodo_pago] || 0) + Number(p.monto_total); });

    // Ingresos del mes por tipo de plan
    const porPlan = {};
    pagosMes.forEach((p) => {
        const nombrePlan = p.membresias?.planes?.nombre || 'Otro plan';
        if (!porPlan[nombrePlan]) porPlan[nombrePlan] = { monto: 0, cantidad: 0 };
        porPlan[nombrePlan].monto += Number(p.monto_total);
        porPlan[nombrePlan].cantidad += 1;
    });
    const planesOrdenados = Object.entries(porPlan).sort((a, b) => b[1].monto - a[1].monto);

    const desglosePlanesHtml = `<div class="panel">
        <div class="panel-header">
            <h3>Ingresos del mes por tipo de plan</h3>
            <button type="button" class="btn-action cyan btn-sm" data-nav="planes">Gestionar Tarifas</button>
        </div>
        ${planesOrdenados.length ? `<div class="plan-breakdown">
            ${planesOrdenados.map(([nombre, info]) => {
                const pct = totalMes > 0 ? Math.round((info.monto / totalMes) * 100) : 0;
                return `<div class="plan-row">
                    <div class="plan-row-top">
                        <strong>${esc(nombre)} <small style="color:var(--text-muted);font-weight:400;">(${info.cantidad} ${info.cantidad === 1 ? 'venta' : 'ventas'})</small></strong>
                        <span><strong style="color:var(--text-main)">${money(info.monto)}</strong> · ${pct}%</span>
                    </div>
                    <div class="plan-progress"><i style="width:${pct}%"></i></div>
                </div>`;
            }).join('')}
        </div>` : '<p class="vacio">Aún no hay ventas registradas este mes.</p>'}
    </div>`;

    return `<div class="toolbar">
        <span class="kpi-sub">Visión financiera, tarifas y control operativo de PULSO</span>
        <div class="acciones-celda">
            <button class="btn-action cyan" data-nav="planes">🏷️ Tarifas y Planes</button>
            <button class="btn-action primary" data-action="abrir-modal-pago">+ Registrar Pago</button>
        </div>
    </div>

    <section class="kpi-grid">
        ${kpi('Ingresos del Mes', money(totalMes), subMes, 'cash', 'ok')}
        ${kpi('Recaudo de Hoy', money(totalHoy), `${pagosHoy.length} pagos hoy`, 'pulse', '')}
        ${kpi('Socios Vigentes', activos, `de ${sociosList.length} registrados`, 'users', '')}
        ${kpi('Equipo y Novedades', `${staffActivo} activos`, novSinResolver ? `${novSinResolver} novedades sin resolver` : 'Sin novedades pendientes', 'bell', novSinResolver ? 'warn' : 'ok')}
    </section>

    <div class="vista-grid">
        <div class="panel" id="panel-ingresos-admin">${renderGraficaIngresosAdmin('mes')}</div>
        ${donutChart('Ingresos del mes por método de pago', Object.entries(porMetodo))}
    </div>

    <div class="vista-grid">
        ${desglosePlanesHtml}
        ${heatmapHoras('Mapa de calor: Horas pico (30 días)', asis30.data)}
    </div>`;
}

// ------------------------------------------------------------
// 1B. MÓDULO DUEÑO: PLANES, PROMOCIONES Y TARIFAS
// ------------------------------------------------------------
async function vistaPlanesAdmin() {
    const [planesRes, pagosRes] = await Promise.all([
        q(db.from('planes').select('*').order('dias_duracion')),
        q(db.from('pagos').select('monto_total, estado, membresias(plan_id)').eq('estado', 'Registrado')),
    ]);

    cachePlanes = planesRes.data || [];
    const statsPorPlan = {};
    (pagosRes.data || []).forEach((p) => {
        const pid = p.membresias?.plan_id;
        if (!pid) return;
        if (!statsPorPlan[pid]) statsPorPlan[pid] = { ventas: 0, total: 0 };
        statsPorPlan[pid].ventas += 1;
        statsPorPlan[pid].total += Number(p.monto_total);
    });

    const tarjetas = cachePlanes.map((p) => {
        const dias = p.dias_duracion ?? p.duracion_dias ?? 30;
        const activo = p.activo !== false;
        const esPromo = Boolean(p.es_promocion);
        const st = statsPorPlan[p.id] || { ventas: 0, total: 0 };

        return `<div class="plan-card ${activo ? '' : 'inactivo'}">
            <div>
                <div class="plan-card-head">
                    <div>
                        <strong style="font-size:1.12rem;">${esc(p.nombre)}</strong>
                        <div style="margin-top:5px;display:flex;gap:6px;flex-wrap:wrap;">
                            ${badge(activo ? 'Activo en Caja' : 'Inactivo', activo ? 'ok' : 'mal').h}
                            ${esPromo ? badge('Promoción', 'purple').h : badge('Plan Estándar', 'info').h}
                        </div>
                    </div>
                </div>
                <p class="plan-card-price" style="margin-top:14px;">${money(p.precio)}</p>
                <div class="plan-card-meta" style="margin-top:8px;">
                    <span>⏱️ Duración: <strong>${dias} ${dias === 1 ? 'día' : 'días'}</strong></span>
                    <span>📊 Histórico: <strong>${st.ventas}</strong> ${st.ventas === 1 ? 'venta' : 'ventas'} (${money(st.total)})</span>
                </div>
            </div>
            <div class="acciones-celda" style="border-top:1px solid var(--border);padding-top:12px;">
                <button type="button" class="btn-action cyan btn-sm" data-action="editar-plan" data-plan="${p.id}">✏️ Editar Precio / Datos</button>
                <button type="button" class="btn-action btn-sm" data-action="toggle-plan" data-plan="${p.id}">${activo ? 'Pausar' : 'Activar'}</button>
            </div>
        </div>`;
    }).join('');

    return `<div class="toolbar">
        <div>
            <p class="kpi-sub">Administra tus tarifas y promociones. Al actualizar un precio se aplica solo a cobros nuevos; los pagos anteriores permanecen intactos.</p>
        </div>
        <button type="button" class="btn-action primary" data-action="nuevo-plan">+ Nuevo Plan / Promoción</button>
    </div>
    <div class="info-banner">
        🔒 <strong>Protección contable activa:</strong> Cada pago registrado guarda su propio valor histórico. Modificar el precio aquí actualiza de inmediato el valor que se cobra en <strong>Caja y Pagos</strong> de ahora en adelante sin alterar los ingresos pasados.
    </div>
    ${cachePlanes.length ? `<div class="planes-grid">${tarjetas}</div>` : '<p class="vacio">No hay planes configurados aún.</p>'}`;
}

function abrirModalPlan(planId = '') {
    const plan = cachePlanes.find((p) => p.id === planId);
    const esEdicion = Boolean(plan);
    const diasActual = plan ? (plan.dias_duracion ?? plan.duracion_dias ?? 30) : 30;

    abrirModal(esEdicion ? `Editar: ${plan.nombre}` : 'Crear Nuevo Plan o Promoción', `
        <form id="form-plan" data-plan-id="${esc(planId)}">
            <div class="input-group">
                <label>Nombre del Plan o Promoción *</label>
                <input type="text" name="nombre" required value="${esc(plan?.nombre || '')}" placeholder="Ej: Mensualidad, Promo 2x1 Mes, Trimestral...">
            </div>
            <div class="input-group">
                <label>Tipo de Tarifa *</label>
                <select name="es_promocion">
                    <option value="false" ${!plan?.es_promocion ? 'selected' : ''}>Plan Estándar</option>
                    <option value="true" ${plan?.es_promocion ? 'selected' : ''}>Promoción Especial</option>
                </select>
            </div>
            <div class="input-group">
                <label>Duración en Días *</label>
                <input type="number" name="dias_duracion" min="1" max="3650" required value="${diasActual}" placeholder="Ej: 1, 7, 15, 30">
            </div>
            <div class="input-group">
                <label>Precio a Cobrar ($) *</label>
                <input type="number" name="precio" min="0" step="100" required value="${plan ? Number(plan.precio) : ''}" placeholder="Ej: 80000">
            </div>
            <div class="input-group">
                <label>Disponibilidad en Caja *</label>
                <select name="activo">
                    <option value="true" ${plan?.activo !== false ? 'selected' : ''}>Activo (Visible al cobrar)</option>
                    <option value="false" ${plan?.activo === false ? 'selected' : ''}>Inactivo (Oculto en caja)</option>
                </select>
            </div>
            <button type="submit" class="btn-primary">${esEdicion ? 'Guardar Cambios de Tarifa' : 'Crear Plan / Promoción'}</button>
        </form>
    `);
}

// ------------------------------------------------------------
// 1C. MÓDULO DUEÑO: CRECIMIENTO DE SOCIOS (ANALÍTICO)
// ------------------------------------------------------------
function renderGraficaCrecimientoSocios(modo = 'mes') {
    const items = agruparSerieTemporal(
        cacheSocios,
        (s) => s.fecha_registro || s.created_at || hoy(),
        () => 1,
        modo
    );
    const totalNuevosPeriodo = items.reduce((s, [, v]) => s + v, 0);
    const max = Math.max(1, ...items.map((i) => i[1]));
    const titulos = {
        semana: 'Nuevos socios registrados (Semana a semana)',
        mes: 'Nuevos socios registrados (Mes a mes)',
        anio: 'Nuevos socios registrados (Año a año)',
    };

    return `<div class="panel-header">
            <div>
                <h3>${titulos[modo]}</h3>
                <p class="kpi-sub">Inscripciones en el período visible: <strong style="color:var(--cyan)">+${totalNuevosPeriodo} socios</strong></p>
            </div>
            <div class="period-tabs">
                <button type="button" class="period-tab ${modo === 'semana' ? 'active' : ''}" data-socios-modo="semana">Semana</button>
                <button type="button" class="period-tab ${modo === 'mes' ? 'active' : ''}" data-socios-modo="mes">Mes</button>
                <button type="button" class="period-tab ${modo === 'anio' ? 'active' : ''}" data-socios-modo="anio">Año</button>
            </div>
        </div>
        <div class="barras">
            ${items.map(([lbl, val]) => `<div class="barra">
                <span class="barra-v">+${val}</span>
                <i style="height:${(val / max) * 100}%"></i>
                <span>${esc(lbl)}</span>
            </div>`).join('')}
        </div>`;
}

async function vistaSociosAdmin() {
    const sociosList = await cargarEstadoSocios();
    const d0 = hoy();
    const mesActual = d0.slice(0, 7);
    const dtMesAnt = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    const mesAnterior = `${dtMesAnt.getFullYear()}-${String(dtMesAnt.getMonth() + 1).padStart(2, '0')}`;

    const total = sociosList.length;
    const nuevosMes = sociosList.filter((s) => dia(s.fecha_registro || s.created_at || d0).startsWith(mesActual)).length;
    const nuevosMesAnt = sociosList.filter((s) => dia(s.fecha_registro || s.created_at || d0).startsWith(mesAnterior)).length;
    const vigentes = sociosList.filter((s) => !estadoMembresiaSocio(s).vencida);
    const sinPlan = total - vigentes.length;
    const tasaVigencia = total > 0 ? Math.round((vigentes.length / total) * 100) : 0;

    // Distribución de socios vigentes por tipo de plan
    const distPlanes = {};
    vigentes.forEach((s) => {
        const nombrePlan = s.membresia?.planes?.nombre || 'Plan Activo';
        distPlanes[nombrePlan] = (distPlanes[nombrePlan] || 0) + 1;
    });
    if (sinPlan > 0) distPlanes['Sin plan vigente'] = sinPlan;

    const donutEntries = Object.entries(distPlanes).map(([lbl, cant]) => {
        const pct = total > 0 ? Math.round((cant / total) * 100) : 0;
        return [lbl, cant, `${cant} (${pct}%)`];
    });

    return `<div class="toolbar">
        <span class="kpi-sub">Evolución de inscripciones, retención y distribución de cartera</span>
        <button type="button" class="btn-action primary" data-action="abrir-modal-socio">+ Registrar Nuevo Socio</button>
    </div>

    <section class="kpi-grid">
        ${kpi('Total Socios Registrados', total, 'Base histórica del gimnasio', 'users', '')}
        ${kpi('Nuevos este Mes', `+${nuevosMes}`, `${nuevosMesAnt} el mes anterior`, 'pulse', 'ok')}
        ${kpi('Socios con Plan Vigente', vigentes.length, `${tasaVigencia}% de tasa de vigencia`, 'check', 'ok')}
        ${kpi('Sin Plan Vigente', sinPlan, 'Inactivos o por renovar', 'alert', sinPlan > 0 ? 'warn' : 'ok')}
    </section>

    <div class="vista-grid">
        <div class="panel" id="panel-crecimiento-socios">${renderGraficaCrecimientoSocios('mes')}</div>
        ${donutChart('Distribución actual de socios por plan', donutEntries)}
    </div>`;
}

// ------------------------------------------------------------
// 1D. MÓDULO DUEÑO: EQUIPO ACTIVO Y NOVEDADES DEL GYM
// ------------------------------------------------------------
function renderListaNovedades(filtroEstado = 'todas') {
    const lista = filtroEstado === 'todas'
        ? cacheNovedades
        : cacheNovedades.filter((n) => n.estado === filtroEstado);

    if (!lista.length) {
        return '<p class="vacio">No hay novedades en esta categoría.</p>';
    }

    const badgeEstado = (estado) => {
        if (estado === 'Nueva') return badge('Nueva · Sin revisar', 'info').h;
        if (estado === 'Pendiente') return badge('Pendiente · Revisada en proceso', 'warn').h;
        return badge('Resuelta', 'ok').h;
    };

    return `<div class="novedad-list">
        ${lista.map((n) => {
            const clsEstado = n.estado === 'Nueva' ? 'estado-nueva' : n.estado === 'Pendiente' ? 'estado-pendiente' : 'estado-resuelta';
            return `<div class="novedad-card ${clsEstado}">
                <div class="novedad-body">
                    <div class="novedad-meta">
                        ${badgeEstado(n.estado)}
                        ${badge(n.categoria || 'General', '').h}
                        <span>Por <strong>${esc(n.autor_nombre)}</strong> (${esc(n.autor_rol)}) · ${fechaHora(n.created_at)}</span>
                    </div>
                    <p class="novedad-msg">${esc(n.mensaje)}</p>
                </div>
                <div class="acciones-celda">
                    ${n.estado === 'Nueva' ? `<button type="button" class="btn-action warn btn-sm" data-action="estado-novedad" data-id="${n.id}" data-estado="Pendiente">👁️ Marcar Pendiente</button>` : ''}
                    ${n.estado !== 'Resuelta' ? `<button type="button" class="btn-action whatsapp btn-sm" data-action="estado-novedad" data-id="${n.id}" data-estado="Resuelta">✓ Marcar Resuelta</button>` : ''}
                </div>
            </div>`;
        }).join('')}
    </div>`;
}

async function vistaEquipoYNovedades() {
    const [equipo, novRes] = await Promise.all([
        obtenerEquipoSafe(),
        obtenerNovedadesSafe(),
    ]);

    const trabajadores = equipo.filter((e) => e.rol === 'recepcion' || e.rol === 'entrenador');
    const activosTotal = trabajadores.filter((e) => e.activo).length;
    const entrenadoresActivos = trabajadores.filter((e) => e.activo && e.rol === 'entrenador').length;
    const recepcionActivos = trabajadores.filter((e) => e.activo && e.rol === 'recepcion').length;

    const nuevasCount = cacheNovedades.filter((n) => n.estado === 'Nueva').length;
    const pendientesCount = cacheNovedades.filter((n) => n.estado === 'Pendiente').length;

    const filasEquipo = equipo.map((e) => {
        const esYo = e.id === perfil.id;
        const rolLabel = e.rol === 'admin' ? 'Dueño / Admin' : e.rol === 'recepcion' ? 'Recepción' : e.rol === 'entrenador' ? 'Entrenador' : e.rol;
        return [
            e.nombre || '—',
            e.email || '—',
            badge(rolLabel, e.rol === 'admin' ? 'info' : e.rol === 'entrenador' ? 'warn' : 'ok'),
            badge(e.activo ? 'Cuenta Activa' : 'Desactivada', e.activo ? 'ok' : 'mal'),
            {
                h: esYo
                    ? '<span class="kpi-sub">Tu cuenta actual</span>'
                    : `<button type="button" class="btn-action ${e.activo ? 'danger' : 'cyan'} btn-sm" data-action="toggle-empleado" data-id="${e.id}" data-activo="${e.activo}">${e.activo ? 'Desactivar acceso' : 'Reactivar acceso'}</button>`
            }
        ];
    });

    const avisoSql = novRes.error
        ? `<div class="info-banner" style="border-color:rgba(251,191,36,0.4);color:#fde68a;">
            ⚠️ Para habilitar el buzón de novedades en vivo, ejecuta primero el script SQL de <strong>novedades_gym</strong> en Supabase.
          </div>`
        : '';

    return `<section class="kpi-grid">
        ${kpi('Personal Activo', activosTotal, `de ${trabajadores.length} trabajadores registrados`, 'users', 'ok')}
        ${kpi('Entrenadores Activos', entrenadoresActivos, 'Cuentas de sala habilitadas', 'pulse', '')}
        ${kpi('Recepción Activa', recepcionActivos, 'Cuentas de mostrador habilitadas', 'check', '')}
        ${kpi('Novedades por Atender', nuevasCount + pendientesCount, `${nuevasCount} nuevas · ${pendientesCount} pendientes`, 'bell', nuevasCount + pendientesCount > 0 ? 'warn' : 'ok')}
    </section>

    ${tabla('Cuentas del equipo de trabajo (roles_empleados)', ['Nombre', 'Correo', 'Rol', 'Estado', 'Control de Acceso'], filasEquipo)}

    ${avisoSql}
    <div class="panel">
        <div class="panel-header">
            <div>
                <h3>Buzón de novedades del gimnasio</h3>
                <p class="kpi-sub">Reportes enviados por entrenadores y recepción. Márcalos como <strong>Pendiente</strong> al revisarlos o <strong>Resuelta</strong> al solucionarlos.</p>
            </div>
            <div class="acciones-celda">
                <div class="period-tabs" id="tabs-novedades">
                    <button type="button" class="period-tab active" data-nov-filtro="todas">Todas (${cacheNovedades.length})</button>
                    <button type="button" class="period-tab" data-nov-filtro="Nueva">Nuevas (${nuevasCount})</button>
                    <button type="button" class="period-tab" data-nov-filtro="Pendiente">Pendientes (${pendientesCount})</button>
                    <button type="button" class="period-tab" data-nov-filtro="Resuelta">Resueltas</button>
                </div>
                <button type="button" class="btn-action primary btn-sm" data-action="abrir-modal-novedad">+ Nueva Novedad</button>
            </div>
        </div>
        <div id="contenedor-novedades">${renderListaNovedades('todas')}</div>
    </div>`;
}

// ------------------------------------------------------------
// 2. VISTA DE RECEPCIÓN (Mostrador Rápido + Alertas + WhatsApp)
// ------------------------------------------------------------
function renderResultadosCheckin(filtro = '') {
    const qTxt = filtro.trim().toLowerCase();
    const lista = qTxt
        ? cacheSocios.filter((s) => s.nombre_completo.toLowerCase().includes(qTxt) || s.documento_identidad.toLowerCase().includes(qTxt))
        : cacheSocios.slice(0, 6);

    if (!lista.length) return '<p class="vacio">No se encontraron socios con ese nombre o documento.</p>';

    return lista.map((s) => {
        const est = estadoMembresiaSocio(s);
        const wa = whatsappLink(s.telefono, s.nombre_completo, est.fechaFin);
        return `<div class="checkin-item ${est.vencida ? 'vencido' : ''}">
            <div class="checkin-meta">
                <strong>${esc(s.nombre_completo)} <small style="color:var(--text-muted);font-weight:400;">(${esc(s.documento_identidad)})</small></strong>
                <span>${esc(est.plan)} · ${est.vencida ? '⚠️ Acceso con alerta de vencimiento' : 'Listo para entrenar'}</span>
            </div>
            <div class="acciones-celda">
                ${badge(est.texto, est.tipo).h}
                <button class="btn-action primary btn-sm" data-action="checkin" data-socio="${s.id}" data-nombre="${esc(s.nombre_completo)}">✓ Registrar Ingreso</button>
                ${est.vencida && wa ? `<a href="${wa}" target="_blank" rel="noopener" class="btn-action whatsapp btn-sm">📲 Avisar WhatsApp</a>` : ''}
                <button class="btn-action cyan btn-sm" data-action="abrir-modal-pago" data-socio="${s.id}">💳 Cobrar Plan</button>
            </div>
        </div>`;
    }).join('');
}

async function inicioRecepcion() {
    const d0 = hoy();
    const [sociosList, pagosHoy, asis7] = await Promise.all([
        cargarEstadoSocios(),
        q(db.from('pagos').select('monto_total').eq('estado', 'Registrado').gte('fecha_pago', new Date(d0 + 'T00:00:00').toISOString())),
        q(db.from('asistencias').select('socio_id, fecha_hora_ingreso').gte('fecha_hora_ingreso', desde7dias()).order('fecha_hora_ingreso', { ascending: false })),
    ]);

    const asisHoy = asis7.data.filter((a) => dia(a.fecha_hora_ingreso) === d0);
    const recaudoHoy = pagosHoy.data.reduce((s, p) => s + Number(p.monto_total), 0);
    const porVencer = sociosList.filter((s) => {
        const est = estadoMembresiaSocio(s);
        return est.porVencer || (est.vencida && est.fechaFin && est.fechaFin >= masDias(-7));
    });

    const nombresMap = {};
    sociosList.forEach((s) => { nombresMap[s.id] = s.nombre_completo; });

    const filasPorVencer = porVencer.map((s) => {
        const est = estadoMembresiaSocio(s);
        const wa = whatsappLink(s.telefono, s.nombre_completo, est.fechaFin);
        return [
            s.nombre_completo,
            s.telefono || '—',
            badge(est.texto, est.tipo),
            {
                h: `<div class="acciones-celda">
                    ${wa ? `<a href="${wa}" target="_blank" rel="noopener" class="btn-action whatsapp btn-sm">📲 WhatsApp</a>` : ''}
                    <button class="btn-action cyan btn-sm" data-action="abrir-modal-pago" data-socio="${s.id}">Renovar</button>
                </div>`
            }
        ];
    });

    return `<section class="checkin-hero">
        <div class="toolbar">
            <div>
                <h3>Control de Ingreso Rápido</h3>
                <p class="kpi-sub">Busca por nombre o cédula para marcar asistencia y verificar estado del plan</p>
            </div>
            <div class="acciones-celda">
                <button class="btn-action" data-action="abrir-modal-socio">+ Nuevo Socio</button>
                <button class="btn-action primary" data-action="abrir-modal-pago">+ Registrar Pago</button>
            </div>
        </div>
        <div class="checkin-bar">
            <input id="checkin-search" class="buscador" placeholder="Escribe nombre o documento del socio..." autocomplete="off">
        </div>
        <div id="checkin-resultados" class="checkin-list">${renderResultadosCheckin()}</div>
    </section>

    <section class="kpi-grid">
        ${kpi('Ingresos de Hoy (Sala)', asisHoy.length, 'Personas que entrenaron hoy', 'check', 'ok')}
        ${kpi('Caja del Día', money(recaudoHoy), `${pagosHoy.data.length} cobros hoy`, 'cash', '')}
        ${kpi('Alertas de Vencimiento', porVencer.length, 'Vencidos o por vencer en 3 días', 'alert', porVencer.length ? 'err' : 'ok')}
        ${kpi('Socios Vigentes', sociosList.filter((s) => !estadoMembresiaSocio(s).vencida).length, `de ${sociosList.length} socios`, 'users', '')}
    </section>

    <div class="vista-grid">
        ${tabla('Alertas de renovación (Últimos y próximos vencimientos)', ['Socio', 'Teléfono', 'Estado', 'Gestión'], filasPorVencer)}
        ${tabla('Últimos ingresos registrados hoy', ['Socio', 'Hora de entrada'], asisHoy.slice(0, 8).map((a) => [nombresMap[a.socio_id] || '—', soloHora(a.fecha_hora_ingreso)]))}
    </div>`;
}

// ------------------------------------------------------------
// 3. VISTA DE ENTRENADOR (En Sala Hoy + Horas Pico + Notas)
// ------------------------------------------------------------
async function inicioEntrenador() {
    const [asis30, sociosRes, obsRes, libresRes] = await Promise.all([
        q(db.from('asistencias').select('socio_id, fecha_hora_ingreso').gte('fecha_hora_ingreso', new Date(masDias(-30) + 'T00:00:00').toISOString()).order('fecha_hora_ingreso', { ascending: false })),
        q(db.rpc('listar_socios_basico')),
        q(db.from('observaciones_entrenadores').select('id', { count: 'exact', head: true })),
        sociosLibresSafe(),
    ]);

    const d0 = hoy();
    const asisHoy = asis30.data.filter((a) => dia(a.fecha_hora_ingreso) === d0);
    const asis7 = asis30.data.filter((a) => a.fecha_hora_ingreso >= desde7dias());
    const vigentes = sociosRes.data.filter((s) => s.membresia_activa).length;

    const infoSocio = {};
    sociosRes.data.forEach((s) => { infoSocio[s.id] = s; });

    const enSalaFilas = asisHoy.slice(0, 10).map((a) => {
        const s = infoSocio[a.socio_id];
        return [
            s?.nombre_completo || 'Socio',
            soloHora(a.fecha_hora_ingreso),
            badge(s?.membresia_activa ? 'Vigente' : 'Sin vigencia', s?.membresia_activa ? 'ok' : 'warn'),
            { h: `<button class="btn-action cyan btn-sm" data-action="abrir-modal-obs" data-socio="${a.socio_id}">+ Nota</button>` }
        ];
    });

    const libresPanel = libresRes ? tabla('Libres para entrenamiento hoy', ['Atleta', 'Desde', 'Estado', 'Seguimiento'],
        libresRes.map((l) => [
            l.nombre_completo,
            soloHora(l.libre_desde),
            badge('Libre', 'ok'),
            { h: `<button class="btn-action cyan btn-sm" data-action="abrir-modal-obs" data-socio="${l.id}">+ Nota</button>` }
        ])) : '';

    return `<div class="toolbar">
        <span class="kpi-sub">Monitoreo de entrenamiento en sala y seguimiento técnico</span>
        <button class="btn-action primary" data-action="abrir-modal-obs">+ Nueva Observación</button>
    </div>
    <section class="kpi-grid">
        ${kpi('En Sala Hoy', asisHoy.length, 'Atletas registrados hoy', 'pulse', 'ok')}
        ${kpi('Asistencias (7 días)', asis7.length, 'Frecuencia semanal', 'check', '')}
        ${kpi('Socios Vigentes', vigentes, `de ${sociosRes.data.length} registrados`, 'users', '')}
        ${kpi('Mis Observaciones', obsRes.count ?? 0, 'Fichas técnicas creadas', 'note', '')}
    </section>
    <div class="vista-grid">
        ${libresPanel}
        ${tabla('Atletas en sala hoy', ['Atleta', 'Hora ingreso', 'Membresía', 'Seguimiento'], enSalaFilas)}
        ${barras('Flujo de atletas (Últimos 7 días)', asistenciasPorDia(asis7))}
    </div>
    ${heatmapHoras('Horas de mayor afluencia en sala', asis30.data)}`;
}

// ------------------------------------------------------------
// 4. VISTA DE CLIENTE ("Mi Pulso" - Pase Digital y Progreso)
// ------------------------------------------------------------
async function inicioCliente() {
    const [mem, asis30, pago, obs, estadoLibre] = await Promise.all([
        q(db.from('membresias').select('estado, fecha_inicio, fecha_fin, planes(nombre, dias_duracion)').order('fecha_fin', { ascending: false })),
        q(db.from('asistencias').select('fecha_hora_ingreso').gte('fecha_hora_ingreso', new Date(masDias(-30) + 'T00:00:00').toISOString()).order('fecha_hora_ingreso', { ascending: false })),
        q(db.from('pagos').select('monto_total, metodo_pago, fecha_pago').eq('estado', 'Registrado').order('fecha_pago', { ascending: false }).limit(1)),
        q(db.from('observaciones_entrenadores').select('created_at, contenido').order('created_at', { ascending: false }).limit(3)),
        obtenerEstadoLibreSafe(),
    ]);

    const d0 = hoy();
    const vigente = mem.data.find((m) => m.estado === 'Activa' && m.fecha_fin >= d0);
    const diasRest = vigente ? Math.max(0, Math.ceil((new Date(vigente.fecha_fin) - new Date(d0)) / 864e5)) : 0;
    const duracionTotal = vigente?.planes?.dias_duracion || 30;
    const pct = vigente ? Math.min(100, Math.round((diasRest / duracionTotal) * 100)) : 0;
    const r = 46;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    const p = pago.data[0];
    const asis7 = asis30.data.filter((a) => a.fecha_hora_ingreso >= desde7dias());

    const libreHoy = estadoLibre.ok && estadoLibre.desde ? dia(estadoLibre.desde) === d0 : false;
    const libreCard = estadoLibre.ok ? `<div class="libre-card ${libreHoy ? 'activo' : ''}">
        <span class="libre-icon">${ICONS[libreHoy ? 'check' : 'users']}</span>
        <div class="libre-info">
            <strong>${libreHoy ? 'Libre para entrenamiento' : 'Entrenamiento independiente'}</strong>
            <p class="kpi-sub">${libreHoy
                ? `Estás disponible para entrenar en compañía (desde las ${soloHora(estadoLibre.desde)}). Tus entrenadores pueden verlo en sala.`
                : 'Entrenas por tu cuenta. Actívalo y los entrenadores verán hoy que estás abierto a compañía.'}</p>
        </div>
        <button type="button" class="btn-action ${libreHoy ? '' : 'primary'}" data-action="alternar-libre" data-libre="${libreHoy ? 'off' : 'on'}">${libreHoy ? 'Modo independiente' : 'Estoy libre hoy'}</button>
    </div>` : '';

    return `<div class="member-pass">
        <div class="pass-info">
            <span class="pass-tag">Pase Digital PULSO</span>
            <h3 class="pass-plan">${esc(vigente ? vigente.planes?.nombre : 'Sin membresía activa')}</h3>
            <div>${vigente ? badge('MEMBRESÍA ACTIVA', 'ok').h : badge('PLAN VENCIDO - RENUEVA EN RECEPCIÓN', 'mal').h}</div>
            <p class="kpi-sub">${vigente ? `Válida desde ${vigente.fecha_inicio} hasta ${vigente.fecha_fin}` : 'Acércate a recepción para activar tu plan.'}</p>
        </div>
        <div class="pass-ring">
            <svg viewBox="0 0 112 112">
                <circle cx="56" cy="56" r="${r}" fill="none" stroke="#27272a" stroke-width="10" />
                <circle cx="56" cy="56" r="${r}" fill="none" stroke="${vigente ? '#8ce8ff' : '#ff4747'}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${dash} ${circ - dash}" />
            </svg>
            <div class="pass-ring-text">
                <strong>${diasRest}</strong>
                <span>días rest.</span>
            </div>
        </div>
    </div>

    ${libreCard}

    <section class="kpi-grid">
        ${kpi('Asistencias (30 días)', asis30.data.length, 'Entrenamientos completados', 'pulse', 'ok')}
        ${kpi('Esta Semana', asis7.length, 'Días entrenados (7d)', 'check', '')}
        ${kpi('Última Visita', asis30.data[0] ? fechaHora(asis30.data[0].fecha_hora_ingreso) : '—', 'Registro en sala', 'card', '')}
        ${kpi('Último Pago', p ? money(p.monto_total) : '—', p ? `${p.metodo_pago} · ${fechaHora(p.fecha_pago)}` : '', 'cash', '')}
    </section>

    <div class="vista-grid">
        ${barras('Mi constancia de entrenamiento (7 días)', asistenciasPorDia(asis7))}
        ${tabla('Recomendaciones de tu entrenador', ['Fecha', 'Observación'], obs.data.map((o) => [fechaHora(o.created_at), o.contenido]))}
    </div>`;
}

// ------------------------------------------------------------
// VISTAS SECUNDARIAS (Socios, Asistencias, Pagos, Auditoría, Notas)
// ------------------------------------------------------------
async function vistaSocios() {
    if (perfil.rol === 'admin') {
        return vistaSociosAdmin();
    }

    if (perfil.rol === 'entrenador') {
        const r = await q(db.rpc('listar_socios_basico'));
        const cab = ['Atleta', 'Estado Cuenta', 'Membresía', 'Acción'];
        const filas = r.data.map((s) => [
            s.nombre_completo,
            badge(s.activo ? 'Activo' : 'Inactivo', s.activo ? 'ok' : 'mal'),
            badge(s.membresia_activa ? 'Vigente' : 'Sin vigencia', s.membresia_activa ? 'ok' : 'warn'),
            { h: `<button class="btn-action cyan btn-sm" data-action="abrir-modal-obs" data-socio="${s.id}">+ Observación</button>` }
        ]);
        return `<div class="toolbar">
            <input id="buscar-socio" class="buscador" placeholder="Buscar atleta por nombre...">
        </div>
        <div id="tabla-socios" data-vista="socios-entrenador">${tabla('', cab, filas)}</div>`;
    }

    const sociosList = await cargarEstadoSocios();
    const cab = ['Documento', 'Nombre', 'Teléfono', 'Membresía', 'Acciones Rápidas'];
    const construirFilas = (lista) => lista.map((s) => {
        const est = estadoMembresiaSocio(s);
        const wa = whatsappLink(s.telefono, s.nombre_completo, est.fechaFin);
        return [
            s.documento_identidad,
            s.nombre_completo,
            s.telefono || '—',
            badge(est.texto, est.tipo),
            {
                h: `<div class="acciones-celda">
                    <button class="btn-action primary btn-sm" data-action="checkin" data-socio="${s.id}" data-nombre="${esc(s.nombre_completo)}">✓ Ingreso</button>
                    <button class="btn-action cyan btn-sm" data-action="abrir-modal-pago" data-socio="${s.id}">💳 Pagar</button>
                    ${wa ? `<a href="${wa}" target="_blank" rel="noopener" class="btn-action whatsapp btn-sm">📲 WhatsApp</a>` : ''}
                </div>`
            }
        ];
    });

    window._filtrarSociosStaff = (txt) => {
        const t = txt.toLowerCase();
        const filtrados = sociosList.filter((s) =>
            s.nombre_completo.toLowerCase().includes(t) ||
            s.documento_identidad.toLowerCase().includes(t) ||
            (s.telefono || '').includes(t)
        );
        $('tabla-socios').innerHTML = tabla('', cab, construirFilas(filtrados));
    };

    return `<div class="toolbar">
        <input id="buscar-socio" class="buscador" placeholder="Buscar por nombre, cédula o teléfono...">
        <button class="btn-action primary" data-action="abrir-modal-socio">+ Registrar Nuevo Socio</button>
    </div>
    <div id="tabla-socios">${tabla('', cab, construirFilas(sociosList))}</div>`;
}

async function vistaAsistencias() {
    const r = await q(db.from('asistencias').select('socio_id, fecha_hora_ingreso').order('fecha_hora_ingreso', { ascending: false }).limit(60));
    if (perfil.rol === 'cliente') {
        return tabla('Mis últimas asistencias', ['Fecha y hora'], r.data.map((a) => [fechaHora(a.fecha_hora_ingreso)]));
    }
    const nombres = {};
    (await q(db.rpc('listar_socios_basico'))).data.forEach((s) => { nombres[s.id] = s.nombre_completo; });
    return tabla('Historial de asistencias (Últimos 60 ingresos)', ['Socio', 'Fecha y hora'], r.data.map((a) => [nombres[a.socio_id] || '—', fechaHora(a.fecha_hora_ingreso)]));
}

async function vistaPagos() {
    const r = await q(db.from('pagos').select('id, fecha_pago, monto_total, metodo_pago, estado, motivo_anulacion, fecha_anulacion, membresias(socios(nombre_completo), planes(nombre))').order('fecha_pago', { ascending: false }).limit(80));
    const cli = perfil.rol === 'cliente';
    const esAdmin = perfil.rol === 'admin';

    const cab = cli
        ? ['Fecha', 'Plan', 'Monto', 'Método', 'Estado']
        : esAdmin
            ? ['Fecha', 'Socio', 'Plan', 'Monto', 'Método', 'Estado', 'Control']
            : ['Fecha', 'Socio', 'Plan', 'Monto', 'Método', 'Estado'];

    const construirFilas = (lista) => lista.map((p) => {
        const celdaEstado = p.estado === 'Anulado' && p.motivo_anulacion && !cli
            ? { h: `${badge('Anulado', 'mal').h}<div class="anulado-motivo" title="Anulado el ${fechaHora(p.fecha_anulacion)}">Motivo: ${esc(p.motivo_anulacion)}</div>` }
            : badge(p.estado, estadoClase[p.estado]);
        const fila = [
            fechaHora(p.fecha_pago),
            p.membresias?.planes?.nombre || '—',
            money(p.monto_total),
            p.metodo_pago,
            celdaEstado
        ];
        if (!cli) fila.splice(1, 0, p.membresias?.socios?.nombre_completo || '—');
        if (esAdmin) {
            fila.push({
                h: p.estado === 'Registrado'
                    ? `<button type="button" class="btn-action danger btn-sm" data-action="anular-pago" data-id="${p.id}" data-monto="${Number(p.monto_total)}">Anular</button>`
                    : '<span class="kpi-sub">—</span>'
            });
        }
        return fila;
    });

    if (!esAdmin) {
        const extra = !cli ? `<button class="btn-action primary" data-action="abrir-modal-pago">+ Registrar Pago Completo</button>` : '';
        return tabla(cli ? 'Mis pagos realizados' : 'Historial de pagos', cab, construirFilas(r.data), extra);
    }

    // Vista enriquecida de Caja y Pagos para el Dueño
    const validos = r.data.filter((p) => p.estado === 'Registrado');
    const sumEfectivo = validos.filter((p) => p.metodo_pago === 'Efectivo').reduce((s, p) => s + Number(p.monto_total), 0);
    const sumNequi = validos.filter((p) => p.metodo_pago === 'Nequi').reduce((s, p) => s + Number(p.monto_total), 0);
    const sumTransf = validos.filter((p) => p.metodo_pago === 'Transferencia').reduce((s, p) => s + Number(p.monto_total), 0);

    window._filtrarPagosAdmin = () => {
        const met = $('filtro-pago-metodo')?.value || 'todos';
        const est = $('filtro-pago-estado')?.value || 'todos';
        const filtrados = r.data.filter((p) =>
            (met === 'todos' || p.metodo_pago === met) &&
            (est === 'todos' || p.estado === est)
        );
        $('tabla-pagos-admin').innerHTML = tabla('', cab, construirFilas(filtrados));
    };

    return `<section class="kpi-grid">
        ${kpi('Efectivo (Últ. 80 mov.)', money(sumEfectivo), 'Dinero físico en caja', 'cash', 'ok')}
        ${kpi('Nequi (Últ. 80 mov.)', money(sumNequi), 'Transferencias Nequi', 'pulse', '')}
        ${kpi('Transferencia (Últ. 80 mov.)', money(sumTransf), 'Consignaciones bancarias', 'card', '')}
        ${kpi('Total Validado', money(sumEfectivo + sumNequi + sumTransf), `${validos.length} cobros registrados`, 'check', 'ok')}
    </section>

    <div class="toolbar">
        <div class="acciones-celda">
            <select id="filtro-pago-metodo" class="buscador" style="min-width:170px;padding:9px 12px;" onchange="window._filtrarPagosAdmin()">
                <option value="todos">Todos los métodos</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Nequi">Nequi</option>
                <option value="Transferencia">Transferencia</option>
            </select>
            <select id="filtro-pago-estado" class="buscador" style="min-width:160px;padding:9px 12px;" onchange="window._filtrarPagosAdmin()">
                <option value="todos">Todos los estados</option>
                <option value="Registrado">Registrado</option>
                <option value="Anulado">Anulado</option>
            </select>
        </div>
        <div class="acciones-celda">
            <button type="button" class="btn-action cyan" data-nav="planes">🏷️ Editar Tarifas</button>
            <button type="button" class="btn-action primary" data-action="abrir-modal-pago">+ Registrar Pago</button>
        </div>
    </div>
    <div id="tabla-pagos-admin">${tabla('Historial de pagos (Con tarifas históricas protegidas)', cab, construirFilas(r.data))}</div>`;
}

async function vistaMembresia() {
    const r = await q(db.from('membresias').select('estado, fecha_inicio, fecha_fin, planes(nombre, precio)').order('fecha_fin', { ascending: false }));
    return tabla('Historial de mis membresías', ['Plan', 'Inicio', 'Vencimiento', 'Valor', 'Estado'], r.data.map((m) => [
        m.planes?.nombre || '—',
        m.fecha_inicio,
        m.fecha_fin,
        m.planes?.precio ? money(m.planes.precio) : '—',
        badge(m.estado, estadoClase[m.estado])
    ]));
}

// Gráfica de línea del progreso de peso (serie: [{fecha, label, peso}])
function graficaLineaPeso(serie) {
    if (serie.length < 2) return '';
    const W = 600, H = 240, pad = { t: 14, r: 18, b: 30, l: 46 };
    const pesos = serie.map((s) => s.peso);
    let min = Math.min(...pesos), max = Math.max(...pesos);
    if (max - min < 2) { min -= 1; max += 1; } else { const m = (max - min) * 0.1; min -= m; max += m; }
    const x = (i) => pad.l + (i / (serie.length - 1)) * (W - pad.l - pad.r);
    const y = (v) => pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b);
    const pts = serie.map((s, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(s.peso).toFixed(1)}`).join(' ');
    const area = `${pts} L${x(serie.length - 1).toFixed(1)},${H - pad.b} L${pad.l},${H - pad.b} Z`;

    let grid = '';
    for (let g = 0; g <= 3; g++) {
        const v = min + ((max - min) / 3) * g;
        grid += `<line x1="${pad.l}" y1="${y(v).toFixed(1)}" x2="${W - pad.r}" y2="${y(v).toFixed(1)}" stroke="rgba(255,255,255,0.07)"/>`
            + `<text x="${pad.l - 8}" y="${(y(v) + 3).toFixed(1)}" text-anchor="end" font-size="10" fill="#8b93a3">${v.toFixed(1)}</text>`;
    }

    const paso = Math.ceil(serie.length / 6);
    const xLabels = serie.map((s, i) => (i % paso === 0 || i === serie.length - 1)
        ? `<text x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="10" fill="#8b93a3">${esc(s.label)}</text>`
        : '').join('');
    const puntos = serie.map((s, i) =>
        `<circle cx="${x(i).toFixed(1)}" cy="${y(s.peso).toFixed(1)}" r="3.5" fill="#8ce8ff"><title>${esc(s.label)}: ${esc(s.peso)} kg</title></circle>`).join('');

    return `<div class="peso-chart">
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Progreso de peso">
            <defs><linearGradient id="peso-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="rgba(140,232,255,0.35)"/>
                <stop offset="100%" stop-color="rgba(140,232,255,0)"/>
            </linearGradient></defs>
            ${grid}
            <path d="${area}" fill="url(#peso-area)"/>
            <path d="${pts}" fill="none" stroke="#8ce8ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            ${puntos}${xLabels}
        </svg>
    </div>`;
}

async function vistaPerfil() {
    const [socioRes, mem, asis30, pago, prefRes, pesoRes] = await Promise.all([
        q(db.from('socios').select('id, documento_identidad, nombre_completo, telefono, fecha_registro, activo').limit(1)),
        q(db.from('membresias').select('estado, fecha_inicio, fecha_fin, planes(nombre)').order('fecha_fin', { ascending: false }).limit(1)),
        q(db.from('asistencias').select('fecha_hora_ingreso').gte('fecha_hora_ingreso', new Date(masDias(-30) + 'T00:00:00').toISOString())),
        q(db.from('pagos').select('monto_total, metodo_pago, fecha_pago').eq('estado', 'Registrado').order('fecha_pago', { ascending: false }).limit(1)),
        // Tolerante a RLS: si la tabla aún no tiene políticas, la vista sigue funcionando
        q(db.from('preferencias_entrenamiento').select('estado').limit(1)).catch(() => ({ data: [] })),
        q(db.from('historial_peso').select('peso, created_at').order('created_at', { ascending: true })).catch(() => ({ data: [] })),
    ]);
    const { data: { session } } = await supabaseClient.auth.getSession();

    const socio = socioRes.data[0] || null;
    const estadoPref = prefRes.data[0]?.estado || 'disponible';

    // Historial de peso: un registro por día (se conserva el último del día)
    const porDiaPeso = {};
    pesoRes.data.forEach((r) => {
        if (r.peso != null) porDiaPeso[dia(r.created_at)] = Number(r.peso);
    });
    const seriePeso = Object.entries(porDiaPeso).map(([f, v]) => ({
        fecha: f,
        label: `${f.slice(8)}/${f.slice(5, 7)}`,
        peso: v,
    }));
    const pesoActual = seriePeso.length ? seriePeso[seriePeso.length - 1].peso : null;
    const pesoInicial = seriePeso.length ? seriePeso[0].peso : null;
    const cambioPeso = pesoActual != null && pesoInicial != null ? Number((pesoActual - pesoInicial).toFixed(1)) : null;
    const nombre = socio?.nombre_completo || perfil.nombre || 'Socio PULSO';
    const iniciales = nombre.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
    const m = mem.data[0];
    const vigente = m && m.estado === 'Activa' && m.fecha_fin >= hoy();
    const p = pago.data[0];
    const desdeRegistro = socio?.fecha_registro
        ? new Date(socio.fecha_registro).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
        : '—';

    return `<div class="perfil-card">
        <div class="perfil-avatar">${esc(iniciales || 'P')}</div>
        <div class="perfil-head-info">
            <span class="pass-tag">Mi Perfil Personal</span>
            <h3>${esc(nombre)}</h3>
            <div class="perfil-badges">
                ${badge('Cliente', 'info').h}
                ${vigente ? badge('MEMBRESÍA ACTIVA', 'ok').h : badge('SIN MEMBRESÍA ACTIVA', 'mal').h}
                ${socio && socio.activo === false ? badge('CUENTA INACTIVA', 'warn').h : ''}
            </div>
        </div>
        <div class="perfil-desde">
            <strong>Socio desde</strong>
            <span>${esc(desdeRegistro)}</span>
        </div>
    </div>

    <div class="panel pref-panel">
        <h3>Mi estado de entrenamiento</h3>
        <p class="kpi-sub">Elige cómo quieres entrenar. Tus entrenadores verán tu estado en sala.</p>
        <div class="pref-switch ${estadoPref === 'autonomo' ? 'en-autonomo' : ''}" id="pref-switch" role="radiogroup" aria-label="Estado de entrenamiento" data-socio="${socio?.id || ''}">
            <span class="pref-thumb" aria-hidden="true"></span>
            <button type="button" class="pref-opt" role="radio" aria-checked="${estadoPref === 'disponible'}" data-action="set-preferencia" data-estado="disponible">Disponible</button>
            <button type="button" class="pref-opt" role="radio" aria-checked="${estadoPref === 'autonomo'}" data-action="set-preferencia" data-estado="autonomo">Autónomo</button>
        </div>
        <p class="pref-desc" id="pref-desc" aria-live="polite">${TEXTO_PREFERENCIA[estadoPref]}</p>
        <p class="pref-saved" id="pref-saved">✓ Estado guardado en tu perfil</p>
    </div>

    <div class="panel peso-panel">
        <h3>Mi peso y progreso</h3>
        <p class="kpi-sub">Registra tu peso para seguir tu evolución con el entrenamiento.</p>
        <form id="form-registrar-peso" class="peso-form" data-socio="${socio?.id || ''}">
            <input type="number" name="peso" step="0.1" min="20" max="300" inputmode="decimal" required placeholder="Peso actual en kg (Ej: 72.5)">
            <button type="submit" class="btn-action primary">+ Registrar peso</button>
        </form>
        ${seriePeso.length ? `
        <div class="perfil-actividad peso-stats">
            <div class="perfil-actividad-item">
                <span class="kpi-sub">Peso actual</span>
                <strong style="color:var(--cyan)">${pesoActual} kg</strong>
            </div>
            <div class="perfil-actividad-item">
                <span class="kpi-sub">Peso inicial</span>
                <strong>${pesoInicial} kg</strong>
            </div>
            <div class="perfil-actividad-item">
                <span class="kpi-sub">Cambio total</span>
                <strong>${cambioPeso > 0 ? '+' : ''}${cambioPeso} kg</strong>
                <span class="kpi-sub">${cambioPeso === 0 ? 'Sin cambios hasta ahora' : cambioPeso < 0 ? 'Has bajado de peso' : 'Has subido de peso'}</span>
            </div>
            <div class="perfil-actividad-item">
                <span class="kpi-sub">Registros</span>
                <strong>${pesoRes.data.length}</strong>
                <span class="kpi-sub">desde ${seriePeso[0].label}</span>
            </div>
        </div>
        ${graficaLineaPeso(seriePeso)}` : '<p class="vacio">Aún no tienes registros de peso. Agrega el primero para empezar a ver tu progreso.</p>'}
    </div>

    <div class="vista-grid">
        ${tabla('Mis datos personales', ['Dato', 'Detalle'], [
            ['Documento de identidad', socio?.documento_identidad || '—'],
            ['Teléfono', socio?.telefono || '—'],
            ['Correo de acceso', session?.user?.email || '—'],
            ['Fecha de registro', desdeRegistro],
        ])}
        <div class="panel">
            <h3>Mi actividad</h3>
            <div class="perfil-actividad">
                <div class="perfil-actividad-item">
                    <span class="kpi-sub">Plan actual</span>
                    <strong>${esc(m?.planes?.nombre || 'Sin plan')}</strong>
                </div>
                <div class="perfil-actividad-item">
                    <span class="kpi-sub">Estado</span>
                    ${m ? badge(m.estado, estadoClase[m.estado]).h : '<span>—</span>'}
                </div>
                <div class="perfil-actividad-item">
                    <span class="kpi-sub">Asistencias (30 días)</span>
                    <strong class="ok-text">${asis30.data.length}</strong>
                </div>
                <div class="perfil-actividad-item">
                    <span class="kpi-sub">Último pago</span>
                    <strong>${p ? money(p.monto_total) : '—'}</strong>
                    <span class="kpi-sub">${p ? `${p.metodo_pago} · ${fechaHora(p.fecha_pago)}` : ''}</span>
                </div>
            </div>
        </div>
    </div>

    <p class="perfil-nota">🔒 Tu teléfono y tu acceso los puedes gestionar tú mismo desde la sección <strong>Configuración</strong>. El nombre y el documento los administra recepción.</p>`;
}

// ------------------------------------------------------------
// VISTA DE CLIENTE: CONFIGURACIÓN DE CUENTA
// ------------------------------------------------------------
async function vistaCuenta() {
    const [socioRes, ses] = await Promise.all([
        q(db.from('socios').select('id, nombre_completo, documento_identidad, telefono').limit(1)),
        supabaseClient.auth.getSession(),
    ]);
    const socio = socioRes.data[0] || null;
    const email = ses.data.session?.user?.email || '—';

    return `<div class="panel cuenta-panel">
        <h3>Datos de contacto</h3>
        <p class="kpi-sub">Tu teléfono es el que usa PULSO para recordatorios y avisos de tu membresía.</p>
        <form id="form-datos-contacto" data-socio="${socio?.id || ''}">
            <div class="input-group">
                <label>Nombre completo (administrado por recepción)</label>
                <input type="text" value="${esc(socio?.nombre_completo || perfil.nombre || '')}" disabled>
            </div>
            <div class="input-group">
                <label>Documento de identidad (no editable)</label>
                <input type="text" value="${esc(socio?.documento_identidad || '—')}" disabled>
            </div>
            <div class="input-group">
                <label for="cta-telefono">Teléfono WhatsApp (10 dígitos)</label>
                <input type="tel" id="cta-telefono" name="telefono" maxlength="10" inputmode="numeric" value="${esc(socio?.telefono || '')}" placeholder="Ej: 3001234567">
            </div>
            <button type="submit" class="btn-primary">Guardar cambios</button>
        </form>
    </div>

    <div class="panel cuenta-panel">
        <h3>Correo de acceso</h3>
        <p class="kpi-sub">Inicias sesión con: <strong style="color:var(--text-main)">${esc(email)}</strong></p>
        <form id="form-cambiar-correo">
            <div class="input-group">
                <label for="cta-email">Nuevo correo</label>
                <input type="email" id="cta-email" name="email" required placeholder="nuevo@correo.com">
            </div>
            <button type="submit" class="btn-primary">Cambiar correo</button>
            <p class="kpi-sub cuenta-aviso">📩 Te enviaremos un enlace de confirmación a tu nuevo correo. El cambio se aplica cuando lo confirmes.</p>
        </form>
    </div>

    <div class="panel cuenta-panel">
        <div class="panel-header">
            <div>
                <h3>Contraseña</h3>
                <p class="kpi-sub">Verificamos tu contraseña actual antes de permitir el cambio.</p>
            </div>
            <button type="button" class="btn-action cyan" data-action="abrir-modal-password">🔑 Cambiar contraseña</button>
        </div>
    </div>`;
}

async function vistaAuditoria() {
    const r = await q(db.from('auditoria').select('created_at, accion, tabla_afectada, descripcion').order('created_at', { ascending: false }).limit(80));
    const cab = ['Fecha', 'Acción', 'Tabla', 'Descripción'];
    const construirFilas = (lista) => lista.map((a) => [
        fechaHora(a.created_at),
        badge(a.accion, a.accion === 'DELETE' ? 'mal' : a.accion === 'UPDATE' ? 'warn' : 'info'),
        a.tabla_afectada,
        a.descripcion || '—'
    ]);

    window._filtrarAuditoria = () => {
        const acc = $('filtro-aud-accion')?.value || 'todas';
        const tab = $('filtro-aud-tabla')?.value || 'todas';
        const filtrados = r.data.filter((a) =>
            (acc === 'todas' || a.accion === acc) &&
            (tab === 'todas' || a.tabla_afectada === tab)
        );
        $('tabla-auditoria').innerHTML = tabla('', cab, construirFilas(filtrados));
    };

    const tablasUnicas = Array.from(new Set(r.data.map((a) => a.tabla_afectada).filter(Boolean)));

    return `<div class="toolbar">
        <span class="kpi-sub">Trazabilidad de modificaciones en la base de datos</span>
        <div class="acciones-celda">
            <select id="filtro-aud-accion" class="buscador" style="min-width:160px;padding:9px 12px;" onchange="window._filtrarAuditoria()">
                <option value="todas">Todas las acciones</option>
                <option value="INSERT">INSERT (Creación)</option>
                <option value="UPDATE">UPDATE (Edición)</option>
                <option value="DELETE">DELETE (Eliminación)</option>
            </select>
            <select id="filtro-aud-tabla" class="buscador" style="min-width:160px;padding:9px 12px;" onchange="window._filtrarAuditoria()">
                <option value="todas">Todas las tablas</option>
                ${tablasUnicas.map((t) => `<option value="${esc(t)}">${esc(t)}</option>`).join('')}
            </select>
        </div>
    </div>
    <div id="tabla-auditoria">${tabla('Registro de auditoría', cab, construirFilas(r.data))}</div>`;
}

async function vistaObservaciones() {
    const r = await q(db.from('observaciones_entrenadores').select('created_at, contenido, visibilidad, socio_id').order('created_at', { ascending: false }));
    const nombres = {};
    (await q(db.rpc('listar_socios_basico'))).data.forEach((s) => { nombres[s.id] = s.nombre_completo; });
    const extra = `<button class="btn-action primary" data-action="abrir-modal-obs">+ Nueva Observación</button>`;
    return tabla('Observaciones de entrenamiento', ['Fecha', 'Atleta', 'Observación', 'Visibilidad'], r.data.map((o) => [
        fechaHora(o.created_at),
        nombres[o.socio_id] || '—',
        o.contenido,
        badge(o.visibilidad === 'compartida' ? 'Compartida con cliente' : 'Privada entrenador', o.visibilidad === 'compartida' ? 'ok' : 'warn')
    ]), extra);
}

// ------------------------------------------------------------
// MODALES Y ACCIONES DE ESCRITURA EN SUPABASE
// ------------------------------------------------------------
function abrirModal(titulo, htmlCuerpo) {
    const card = $('modal-container').querySelector('.modal-card');
    card.classList.remove('is-confirm');
    card.querySelector('.modal-header').classList.remove('hidden');
    $('modal-titulo').textContent = titulo;
    $('modal-cuerpo').innerHTML = htmlCuerpo;
    $('modal-container').classList.remove('hidden');
}

function cerrarModal() {
    const card = $('modal-container').querySelector('.modal-card');
    card.classList.remove('is-confirm');
    card.querySelector('.modal-header').classList.remove('hidden');
    $('modal-container').classList.add('hidden');
    $('modal-cuerpo').innerHTML = '';
}

$('modal-cerrar').addEventListener('click', cerrarModal);
$('modal-container').addEventListener('click', (e) => {
    if (e.target === $('modal-container')) cerrarModal();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('modal-container').classList.contains('hidden')) {
        cerrarModal();
    }
});

function abrirModalCerrarSesion() {
    const card = $('modal-container').querySelector('.modal-card');
    card.classList.add('is-confirm');
    card.querySelector('.modal-header').classList.add('hidden');
    $('modal-cuerpo').innerHTML = `
        <h3 class="confirm-title">Cerrar Sesión</h3>
        <p class="confirm-text">¿Estás seguro de que deseas salir de PULSO?</p>
        <div class="confirm-actions">
            <button type="button" id="btn-cancelar-salida" class="btn-confirm-cancel">Cancelar</button>
            <button type="button" id="btn-confirmar-salida" class="btn-confirm-danger">Sí, salir</button>
        </div>
    `;
    $('modal-container').classList.remove('hidden');
    $('btn-cancelar-salida').addEventListener('click', cerrarModal);
    $('btn-confirmar-salida').addEventListener('click', ejecutarCierreSesion);
}

async function ejecutarCierreSesion() {
    const btnSalir = $('btn-confirmar-salida');
    const btnCancelar = $('btn-cancelar-salida');
    if (btnSalir) {
        btnSalir.disabled = true;
        btnSalir.textContent = 'Saliendo...';
    }
    if (btnCancelar) btnCancelar.disabled = true;

    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        cerrarModal();
        perfil = null;
        mostrarLogin();
    } catch (err) {
        cerrarModal();
        toast('No se pudo cerrar sesión: ' + (err.message || err), 'err');
    }
}

async function alternarEstadoLibre(activar) {
    try {
        await q(db.rpc('definir_estado_libre', { libre: activar }));
        toast(activar ? '✓ Estás libre para entrenamiento hoy' : 'Modo independiente activado');
        if (vistaActual) abrirVista(vistaActual);
    } catch (err) {
        toast('No se pudo cambiar tu estado: ' + (err.message || err), 'err');
    }
}

// Preferencia de entrenamiento del cliente (tabla preferencias_entrenamiento)
const TEXTO_PREFERENCIA = {
    disponible: 'Estás libre para que un entrenador te acompañe.',
    autonomo: 'Entrenas por tu cuenta, de forma independiente.',
};

async function cambiarPreferencia(btn) {
    const grupo = btn.closest('#pref-switch');
    if (!grupo || btn.getAttribute('aria-checked') === 'true') return;

    const nuevo = btn.dataset.estado;
    const socioId = grupo.dataset.socio;
    const desc = $('pref-desc');
    const saved = $('pref-saved');

    // Actualizar el switch al instante (la vista previa anima antes de guardar)
    grupo.classList.toggle('en-autonomo', nuevo === 'autonomo');
    grupo.querySelectorAll('.pref-opt').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.estado === nuevo)));
    grupo.classList.remove('guardado');
    void grupo.offsetWidth;
    grupo.classList.add('guardado');
    if (desc) desc.textContent = TEXTO_PREFERENCIA[nuevo];
    if (saved) saved.classList.add('visible');

    try {
        if (!socioId) throw new Error('No se encontró tu registro de socio.');
        await q(db.from('preferencias_entrenamiento').upsert(
            { socio_id: socioId, estado: nuevo }, // updated_at lo maneja el trigger en Supabase
            { onConflict: 'socio_id' }
        ));
        toast(nuevo === 'disponible' ? '✓ Estado: Disponible' : '✓ Estado: Autónomo');
        setTimeout(() => saved?.classList.remove('visible'), 2500);
    } catch (err) {
        // Revertir el switch si Supabase rechaza el cambio
        grupo.classList.toggle('en-autonomo', nuevo !== 'autonomo');
        grupo.querySelectorAll('.pref-opt').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.estado !== nuevo)));
        if (desc) desc.textContent = TEXTO_PREFERENCIA[nuevo === 'autonomo' ? 'disponible' : 'autonomo'];
        if (saved) saved.classList.remove('visible');
        toast('No se pudo guardar tu estado: ' + (err.message || err), 'err');
    }
}

async function registrarAsistencia(socioId, nombre) {
    try {
        await q(db.from('asistencias').insert({ socio_id: socioId }));
        toast(`✓ Ingreso registrado para ${nombre}`);
        if (vistaActual) abrirVista(vistaActual);
    } catch (err) {
        toast('Error al registrar asistencia: ' + (err.message || err), 'err');
    }
}

function abrirModalNuevoSocio() {
    abrirModal('Registrar Nuevo Socio', `
        <form id="form-nuevo-socio">
            <div class="input-group">
                <label>Documento de Identidad *</label>
                <input type="text" name="documento" required placeholder="Ej: 1047458920">
            </div>
            <div class="input-group">
                <label>Nombre Completo *</label>
                <input type="text" name="nombre" required placeholder="Ej: Carlos Pérez">
            </div>
            <div class="input-group">
                <label>Teléfono WhatsApp (10 dígitos)</label>
                <input type="tel" name="telefono" placeholder="Ej: 3001234567">
            </div>
            <button type="submit" class="btn-primary">Guardar Socio</button>
        </form>
    `);
}

async function abrirModalNuevoPago(socioPreseleccionado = '') {
    try {
        if (!cacheSocios.length) await cargarEstadoSocios();
        // Consulta siempre fresca de planes para reflejar precios actualizados por el dueño
        const planesRes = await q(db.from('planes').select('*').order('precio'));
        const planes = planesRes.data.filter((p) => p.activo !== false);

        const opcionesSocios = cacheSocios.map((s) =>
            `<option value="${s.id}" ${s.id === socioPreseleccionado ? 'selected' : ''}>${esc(s.nombre_completo)} (${esc(s.documento_identidad)})</option>`
        ).join('');

        const opcionesPlanes = planes.map((p) => {
            const dias = p.dias_duracion ?? p.duracion_dias ?? 30;
            const promoTag = p.es_promocion ? ' [PROMO]' : '';
            return `<option value="${p.id}" data-precio="${p.precio}" data-dias="${dias}">${esc(p.nombre)}${promoTag} — ${money(p.precio)} (${dias} días)</option>`;
        }).join('');

        abrirModal('Registrar Pago de Membresía', `
            <form id="form-nuevo-pago">
                <div class="input-group">
                    <label>Socio *</label>
                    <select name="socio_id" required>
                        <option value="">Selecciona un socio...</option>
                        ${opcionesSocios}
                    </select>
                </div>
                <div class="input-group">
                    <label>Plan o Promoción (Tarifa vigente) *</label>
                    <select name="plan_id" id="select-plan-pago" required>
                        ${opcionesPlanes}
                    </select>
                </div>
                <div class="input-group">
                    <label>Método de Pago *</label>
                    <select name="metodo_pago" required>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Nequi">Nequi</option>
                        <option value="Transferencia">Transferencia</option>
                    </select>
                </div>
                <button type="submit" class="btn-primary">Confirmar Pago Completo</button>
            </form>
        `);
    } catch (err) {
        toast('No se pudieron cargar planes/socios: ' + (err.message || err), 'err');
    }
}

async function abrirModalObservacion(socioPreseleccionado = '') {
    try {
        const sociosRes = await q(db.rpc('listar_socios_basico'));
        const opciones = sociosRes.data.map((s) =>
            `<option value="${s.id}" ${s.id === socioPreseleccionado ? 'selected' : ''}>${esc(s.nombre_completo)}</option>`
        ).join('');

        abrirModal('Nueva Observación de Entrenamiento', `
            <form id="form-nueva-obs">
                <div class="input-group">
                    <label>Atleta *</label>
                    <select name="socio_id" required>
                        <option value="">Selecciona un atleta...</option>
                        ${opciones}
                    </select>
                </div>
                <div class="input-group">
                    <label>Visibilidad *</label>
                    <select name="visibilidad" required>
                        <option value="compartida">Compartida (Visible para el cliente)</option>
                        <option value="privada">Privada (Solo entrenadores)</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Observación / Rutina / Avance *</label>
                    <textarea name="contenido" rows="4" required placeholder="Ej: Buen progreso en técnica de sentadilla. Mantener carga moderada esta semana."></textarea>
                </div>
                <button type="submit" class="btn-primary">Guardar Observación</button>
            </form>
        `);
    } catch (err) {
        toast('Error cargando lista de atletas: ' + (err.message || err), 'err');
    }
}

function abrirModalNovedad() {
    abrirModal('Reportar Novedad del Gimnasio', `
        <form id="form-nueva-novedad">
            <div class="input-group">
                <label>Categoría *</label>
                <select name="categoria" required>
                    <option value="Mantenimiento / Máquinas">Mantenimiento / Máquinas</option>
                    <option value="Insumos / Aseo">Insumos / Aseo</option>
                    <option value="Novedad de Turno">Novedad de Turno</option>
                    <option value="General">General</option>
                </select>
            </div>
            <div class="input-group">
                <label>Detalle de la novedad *</label>
                <textarea name="mensaje" rows="4" required placeholder="Ej: La polea alta necesita revisión de guaya o falta jabón en los baños."></textarea>
            </div>
            <button type="submit" class="btn-primary">Enviar al Buzón del Dueño</button>
        </form>
    `);
}

function campoPassword(id, name, placeholder) {
    return `<div class="password-field">
        <input type="password" id="${id}" name="${name}" required minlength="6" autocomplete="new-password" placeholder="${placeholder}">
        <button type="button" class="password-toggle" data-action="ver-password" aria-label="Mostrar contraseña" aria-pressed="false">
            <svg class="eye-icon eye-open" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"></path>
                <circle cx="12" cy="12" r="3.2"></circle>
            </svg>
            <svg class="eye-icon eye-closed" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="m3 3 18 18"></path>
                <path d="M10.6 5.2A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a15.7 15.7 0 0 1-3.1 3.9M6.2 6.3C3.5 8.1 2 12 2 12s3.6 7 10 7c1.1 0 2.1-.2 3-.5"></path>
                <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"></path>
            </svg>
        </button>
    </div>`;
}

function abrirModalRegistro() {
    abrirModal('Crear mi cuenta', `
        <form id="form-registro-cliente">
            <div class="input-group">
                <label for="reg-nombre">Nombre completo *</label>
                <input type="text" id="reg-nombre" name="nombre" required minlength="3" autocomplete="name" placeholder="Ej: Carlos Pérez">
            </div>
            <div class="input-group">
                <label for="reg-documento">Documento de identidad *</label>
                <input type="text" id="reg-documento" name="documento" required inputmode="numeric" maxlength="12" placeholder="Ej: 1047458920">
            </div>
            <div class="input-group">
                <label for="reg-telefono">Teléfono WhatsApp</label>
                <input type="tel" id="reg-telefono" name="telefono" inputmode="numeric" maxlength="10" placeholder="Ej: 3001234567">
            </div>
            <div class="input-group">
                <label for="reg-email">Correo electrónico *</label>
                <input type="email" id="reg-email" name="email" required autocomplete="email" placeholder="tucorreo@ejemplo.com">
            </div>
            <div class="input-group">
                <label for="reg-pass">Contraseña *</label>
                ${campoPassword('reg-pass', 'password', 'Mínimo 6 caracteres')}
            </div>
            <div class="input-group">
                <label for="reg-pass2">Confirmar contraseña *</label>
                ${campoPassword('reg-pass2', 'confirmar', '••••••••')}
            </div>
            <button type="submit" class="btn-primary">Crear cuenta</button>
        </form>
    `);
} {
    abrirModal('Cambiar Contraseña', `
        <form id="form-cambiar-password">
            <div class="input-group">
                <label for="cta-pass-actual">Contraseña actual *</label>
                <input type="password" id="cta-pass-actual" name="actual" required autocomplete="current-password" placeholder="••••••••">
            </div>
            <div class="input-group">
                <label for="cta-pass-nueva">Nueva contraseña *</label>
                <input type="password" id="cta-pass-nueva" name="nueva" required minlength="6" autocomplete="new-password" placeholder="Mínimo 6 caracteres">
            </div>
            <div class="input-group">
                <label for="cta-pass-confirmar">Confirmar nueva contraseña *</label>
                <input type="password" id="cta-pass-confirmar" name="confirmar" required minlength="6" autocomplete="new-password" placeholder="••••••••">
            </div>
            <button type="submit" class="btn-primary">Actualizar contraseña</button>
        </form>
    `);
}

function abrirModalAnularPago(pagoId, monto) {
    abrirModal('Anular Pago', `
        <p class="confirm-text">Vas a anular un pago de <strong style="color:var(--error)">${money(monto)}</strong>.
        El dinero dejará de sumar en caja y la acción quedará registrada en la auditoría con tu usuario.
        Esta operación no se puede deshacer.</p>
        <form id="form-anular-pago" data-id="${esc(pagoId)}" data-monto="${Number(monto)}">
            <div class="input-group">
                <label for="motivo-anulacion">Motivo de la anulación *</label>
                <textarea id="motivo-anulacion" name="motivo" rows="3" required minlength="5" placeholder="Ej: Cobro duplicado, el socio ya había pagado por Nequi, error de dígito en el monto..."></textarea>
            </div>
            <div class="confirm-actions">
                <button type="button" class="btn-confirm-cancel" onclick="cerrarModal()">Cancelar</button>
                <button type="submit" class="btn-confirm-danger">Anular pago</button>
            </div>
        </form>
    `);
}

// Delegación global de eventos para botones y filtros
document.addEventListener('click', async (e) => {
    // Navegación interna desde botones de acceso rápido
    const navBtn = e.target.closest('[data-nav]');
    if (navBtn) {
        const clave = navBtn.dataset.nav;
        const item = MENUS[perfil.rol]?.find((m) => m[0] === clave);
        if (item) abrirVista(item);
        return;
    }

    // Cambio de período en gráfica de ingresos (Admin)
    const ingTab = e.target.closest('[data-ingresos-modo]');
    if (ingTab && $('panel-ingresos-admin')) {
        $('panel-ingresos-admin').innerHTML = renderGraficaIngresosAdmin(ingTab.dataset.ingresosModo);
        return;
    }

    // Cambio de período en gráfica de crecimiento de socios (Admin)
    const socTab = e.target.closest('[data-socios-modo]');
    if (socTab && $('panel-crecimiento-socios')) {
        $('panel-crecimiento-socios').innerHTML = renderGraficaCrecimientoSocios(socTab.dataset.sociosModo);
        return;
    }

    // Filtro de novedades (Todas / Nuevas / Pendientes / Resueltas)
    const novTab = e.target.closest('[data-nov-filtro]');
    if (novTab && $('contenedor-novedades')) {
        document.querySelectorAll('#tabs-novedades .period-tab').forEach((t) => t.classList.remove('active'));
        novTab.classList.add('active');
        $('contenedor-novedades').innerHTML = renderListaNovedades(novTab.dataset.novFiltro);
        return;
    }

    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'checkin') registrarAsistencia(btn.dataset.socio, btn.dataset.nombre);
    if (action === 'abrir-modal-registro') abrirModalRegistro();
    if (action === 'alternar-libre') alternarEstadoLibre(btn.dataset.libre === 'on');
    if (action === 'set-preferencia') cambiarPreferencia(btn);
    if (action === 'abrir-modal-socio') abrirModalNuevoSocio();
    if (action === 'abrir-modal-pago') abrirModalNuevoPago(btn.dataset.socio || '');
    if (action === 'abrir-modal-obs') abrirModalObservacion(btn.dataset.socio || '');
    if (action === 'abrir-modal-novedad') abrirModalNovedad();
    if (action === 'abrir-modal-password') abrirModalPassword();
    if (action === 'nuevo-plan') abrirModalPlan('');
    if (action === 'editar-plan') abrirModalPlan(btn.dataset.plan || '');
    

    if (action === 'toggle-plan') {
        const plan = cachePlanes.find((p) => p.id === btn.dataset.plan);
        if (!plan) return;
        const nuevoEstado = plan.activo === false;
        try {
            await q(db.from('planes').update({ activo: nuevoEstado }).eq('id', plan.id));
            toast(`✓ Plan "${plan.nombre}" ${nuevoEstado ? 'activado' : 'pausado'}`);
            if (vistaActual) abrirVista(vistaActual);
        } catch (err) {
            toast('Error al cambiar estado del plan: ' + (err.message || err), 'err');
        }
    }

    if (action === 'ver-password') {
    const input = btn.closest('.password-field').querySelector('input');
    const mostrar = input.type === 'password';
    input.type = mostrar ? 'text' : 'password';
    btn.classList.toggle('is-visible', mostrar);
    btn.setAttribute('aria-label', mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña');
    btn.setAttribute('aria-pressed', String(mostrar));
}

    if (action === 'anular-pago') {
        abrirModalAnularPago(btn.dataset.id, btn.dataset.monto);
    }

    if (action === 'estado-novedad') {
        const nuevoEstado = btn.dataset.estado;
        try {
            await q(db.from('novedades_gym').update({
                estado: nuevoEstado,
                updated_at: new Date().toISOString()
            }).eq('id', btn.dataset.id));
            toast(nuevoEstado === 'Pendiente'
                ? '👁️ Novedad marcada como Pendiente (revisada)'
                : '✓ Novedad marcada como Resuelta');
            if (vistaActual) abrirVista(vistaActual);
        } catch (err) {
            toast('Error al actualizar novedad: ' + (err.message || err), 'err');
        }
    }

    if (action === 'toggle-empleado') {
        const activoActual = btn.dataset.activo === 'true';
        try {
            await q(db.from('roles_empleados').update({ activo: !activoActual }).eq('id', btn.dataset.id));
            toast(`✓ Acceso ${!activoActual ? 'reactivado' : 'desactivado'}`);
            if (vistaActual) abrirVista(vistaActual);
        } catch (err) {
            toast('Error al actualizar cuenta del trabajador: ' + (err.message || err), 'err');
        }
    }
});

document.addEventListener('input', (e) => {
    if (e.target.id === 'checkin-search') {
        $('checkin-resultados').innerHTML = renderResultadosCheckin(e.target.value);
    }
    if (e.target.id === 'buscar-socio' && window._filtrarSociosStaff) {
        window._filtrarSociosStaff(e.target.value);
    }
});

document.addEventListener('submit', async (e) => {
    // Guardar o editar Plan / Promoción (sin tocar pagos anteriores)
    if (e.target.id === 'form-registro-cliente') {
    e.preventDefault();
    const fd = new FormData(e.target);
    const nombre = String(fd.get('nombre')).trim();
    const documento = String(fd.get('documento')).trim();
    const telefono = String(fd.get('telefono')).trim();
    const email = String(fd.get('email')).trim();
    const password = String(fd.get('password'));

    if (!/^\d{5,12}$/.test(documento)) {
        toast('El documento debe tener solo números (5 a 12 dígitos).', 'err');
        return;
    }
    if (telefono && !/^\d{10}$/.test(telefono)) {
        toast('El teléfono debe tener exactamente 10 dígitos.', 'err');
        return;
    }
    if (password !== String(fd.get('confirmar'))) {
        toast('Las contraseñas no coinciden.', 'err');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
       const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: { data: { nombre_completo: nombre, documento_identidad: documento, telefono } },
});
if (error) throw error;
if (data.user && data.user.identities && data.user.identities.length === 0) {
    throw new Error('Ya existe una cuenta con ese correo.');
}
cerrarModal();
if (data.session) {
    toast('✓ Cuenta creada. ¡Bienvenido a PULSO!');
    await cargarPerfil();
} else {
    // Sin sesión: Supabase exige confirmar el correo antes de entrar
    toast('📩 Cuenta creada. Confirma tu correo y luego inicia sesión.');
}
}
    if (e.target.id === 'form-plan') {
        e.preventDefault();
        const fd = new FormData(e.target);
        const planId = e.target.dataset.planId;
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;

        const payload = {
            nombre: fd.get('nombre').trim(),
            dias_duracion: Number(fd.get('dias_duracion')),
            precio: Number(fd.get('precio')),
            activo: fd.get('activo') === 'true',
            es_promocion: fd.get('es_promocion') === 'true',
        };

        try {
            let res = planId
                ? await db.from('planes').update(payload).eq('id', planId)
                : await db.from('planes').insert(payload);

            // Fallback si aún no se ha agregado la columna es_promocion en SQL
            if (res.error && String(res.error.message || '').includes('es_promocion')) {
                delete payload.es_promocion;
                res = planId
                    ? await db.from('planes').update(payload).eq('id', planId)
                    : await db.from('planes').insert(payload);
            }
            if (res.error) throw res.error;

            cerrarModal();
            toast(planId
                ? '✓ Tarifa actualizada (aplicará a cobros nuevos)'
                : '✓ Nuevo plan/promoción creado');
            if (vistaActual) abrirVista(vistaActual);
        } catch (err) {
            toast('Error al guardar el plan: ' + (err.message || err), 'err');
            btn.disabled = false;
        }
    }

    if (e.target.id === 'form-nuevo-socio') {
        e.preventDefault();
        const fd = new FormData(e.target);
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        try {
            await q(db.from('socios').insert({
                documento_identidad: fd.get('documento').trim(),
                nombre_completo: fd.get('nombre').trim(),
                telefono: fd.get('telefono').trim() || null,
                activo: true,
            }));
            cerrarModal();
            toast('✓ Socio registrado correctamente');
            if (vistaActual) abrirVista(vistaActual);
        } catch (err) {
            toast('Error al crear socio: ' + (err.message || err), 'err');
            btn.disabled = false;
        }
    }

    if (e.target.id === 'form-nuevo-pago') {
        e.preventDefault();
        const fd = new FormData(e.target);
        const selectPlan = $('select-plan-pago');
        const opt = selectPlan.options[selectPlan.selectedIndex];
        const monto = Number(opt.dataset.precio || 0);
        const dias = Number(opt.dataset.dias || 30);
        const socioId = fd.get('socio_id');
        const planId = fd.get('plan_id');
        const metodo = fd.get('metodo_pago');

        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        try {
            const fechaInicio = hoy();
            const fechaFin = masDias(Math.max(0, dias - 1));
            const memRes = await q(db.from('membresias').insert({
                socio_id: socioId,
                plan_id: planId,
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin,
                estado: 'Activa',
            }).select().single());

            await q(db.from('pagos').insert({
                membresia_id: memRes.data.id,
                monto_total: monto,
                metodo_pago: metodo,
                estado: 'Registrado',
            }));

            cerrarModal();
            toast(`✓ Pago de ${money(monto)} registrado (${metodo})`);
            if (vistaActual) abrirVista(vistaActual);
        } catch (err) {
            toast('Error al registrar pago: ' + (err.message || err), 'err');
            btn.disabled = false;
        }
    }

    if (e.target.id === 'form-nueva-obs') {
        e.preventDefault();
        const fd = new FormData(e.target);
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        const payload = {
            socio_id: fd.get('socio_id'),
            visibilidad: fd.get('visibilidad'),
            contenido: fd.get('contenido').trim(),
        };
        try {
            await q(db.from('observaciones_entrenadores').insert(payload));
            cerrarModal();
            toast('✓ Observación guardada');
            if (vistaActual) abrirVista(vistaActual);
        } catch (err) {
            toast('Error al guardar observación: ' + (err.message || err), 'err');
            btn.disabled = false;
        }
    }

    if (e.target.id === 'form-registrar-peso') {
        e.preventDefault();
        const socioId = e.target.dataset.socio;
        if (!socioId) {
            toast('No se encontró tu registro de socio.', 'err');
            return;
        }
        const fd = new FormData(e.target);
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        try {
            await q(db.from('historial_peso').insert({
                socio_id: socioId,
                peso: Number(fd.get('peso')),
            }));
            toast('✓ Peso registrado correctamente');
            if (vistaActual) abrirVista(vistaActual);
        } catch (err) {
            toast('No se pudo registrar tu peso: ' + (err.message || err), 'err');
            btn.disabled = false;
        }
    }

    if (e.target.id === 'form-anular-pago') {
        e.preventDefault();
        const pagoId = e.target.dataset.id;
        const motivo = String(new FormData(e.target).get('motivo') || '').trim();
        if (motivo.length < 5) {
            toast('Describe el motivo de la anulación (mínimo 5 caracteres).', 'err');
            return;
        }
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        try {
            // El trigger trg_proteger_pagos valida el motivo y fija anulado_por y
            // fecha_anulacion; trg_auditoria_pagos registra la ANULACION automáticamente.
            // Condición extra: solo se anula si sigue Registrado (evita doble anulación)
            const res = await q(db.from('pagos').update({
                estado: 'Anulado',
                motivo_anulacion: motivo,
            }).eq('id', pagoId).eq('estado', 'Registrado').select('id'));

            if (!res.data || !res.data.length) {
                throw new Error('Este pago ya no está registrado (probablemente fue anulado en otra pantalla).');
            }

            cerrarModal();
            toast('✓ Pago anulado (registrado en auditoría)');
            if (vistaActual) abrirVista(vistaActual);
        } catch (err) {
            toast('No se pudo anular el pago: ' + (err.message || err), 'err');
            btn.disabled = false;
        }
    }

    if (e.target.id === 'form-datos-contacto') {
        e.preventDefault();
        const socioId = e.target.dataset.socio;
        if (!socioId) {
            toast('No se encontró tu registro de socio.', 'err');
            return;
        }
        const telefono = String(new FormData(e.target).get('telefono') || '').trim();
        if (telefono && !/^\d{10}$/.test(telefono)) {
            toast('El teléfono debe tener exactamente 10 dígitos.', 'err');
            return;
        }
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        try {
            await q(db.from('socios').update({ telefono: telefono || null }).eq('id', socioId));
            toast('✓ Datos de contacto actualizados');
            if (vistaActual) abrirVista(vistaActual);
        } catch (err) {
            toast('No se pudo actualizar: ' + (err.message || err), 'err');
            btn.disabled = false;
        }
    }

    if (e.target.id === 'form-cambiar-correo') {
        e.preventDefault();
        const nuevo = String(new FormData(e.target).get('email') || '').trim();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        try {
            const { error } = await supabaseClient.auth.updateUser({ email: nuevo });
            if (error) throw error;
            toast('📩 Revisa tu nuevo correo: te enviamos el enlace de confirmación');
            e.target.reset();
        } catch (err) {
            toast('No se pudo cambiar el correo: ' + (err.message || err), 'err');
        } finally {
            btn.disabled = false;
        }
    }

    if (e.target.id === 'form-cambiar-password') {
        e.preventDefault();
        const fd = new FormData(e.target);
        const actual = String(fd.get('actual') || '');
        const nueva = String(fd.get('nueva') || '');
        const confirmar = String(fd.get('confirmar') || '');
        if (nueva !== confirmar) {
            toast('Las nuevas contraseñas no coinciden.', 'err');
            return;
        }
        if (nueva.length < 6) {
            toast('La nueva contraseña debe tener al menos 6 caracteres.', 'err');
            return;
        }
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        try {
            // Verificar la contraseña actual antes de permitir el cambio
            const { data: { session } } = await supabaseClient.auth.getSession();
            const { error: verif } = await supabaseClient.auth.signInWithPassword({
                email: session?.user?.email,
                password: actual,
            });
            if (verif) throw new Error('La contraseña actual no es correcta.');

            const { error } = await supabaseClient.auth.updateUser({ password: nueva });
            if (error) throw error;
            cerrarModal();
            toast('✓ Contraseña actualizada correctamente');
        } catch (err) {
            toast('No se pudo cambiar la contraseña: ' + (err.message || err), 'err');
        } finally {
            btn.disabled = false;
        }
    }

    if (e.target.id === 'form-nueva-novedad') {
        e.preventDefault();
        const fd = new FormData(e.target);
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        try {
            await q(db.from('novedades_gym').insert({
                autor_id: perfil.id,
                autor_nombre: perfil.nombre || 'Personal PULSO',
                autor_rol: perfil.rol,
                categoria: fd.get('categoria'),
                mensaje: fd.get('mensaje').trim(),
                estado: 'Nueva',
            }));
            cerrarModal();
            toast('✓ Novedad enviada al buzón del dueño');
            if (vistaActual) abrirVista(vistaActual);
        } catch (err) {
            toast('Error al enviar novedad: ' + (err.message || err), 'err');
            btn.disabled = false;
        }
    }
});

// ------------------------------------------------------------
// Menú por Rol: [clave, texto, icono, subtítulo, función]
// ------------------------------------------------------------
const MENUS = {
    admin: [
        ['inicio', 'Panel Ejecutivo', 'home', 'Evolución financiera, ingresos por plan y horas pico', inicioAdmin],
        ['planes', 'Planes y Tarifas', 'tag', 'Precios, promociones y duración de membresías', vistaPlanesAdmin],
        ['socios', 'Socios y Crecimiento', 'users', 'Evolución de inscripciones y distribución por plan', vistaSocios],
        ['pagos', 'Caja y Pagos', 'cash', 'Arqueo por método, cobros y control histórico', vistaPagos],
        ['equipo', 'Equipo y Novedades', 'bell', 'Cuentas activas del personal y buzón de reportes', vistaEquipoYNovedades],
        ['auditoria', 'Auditoría', 'shield', 'Trazabilidad de cambios en el sistema', vistaAuditoria],
    ],
    recepcion: [
        ['inicio', 'Mostrador Rápido', 'home', 'Check-in inmediato, alertas de vencimiento y WhatsApp', inicioRecepcion],
        ['socios', 'Socios', 'users', 'Consulta rápida, registro y renovaciones', vistaSocios],
        ['asistencias', 'Asistencias', 'check', 'Control de ingresos del día', vistaAsistencias],
        ['pagos', 'Pagos', 'cash', 'Registro de pagos completos en recepción', vistaPagos],
    ],
    entrenador: [
        ['inicio', 'Sala de Entrenamiento', 'home', 'Atletas activos hoy y flujo horario', inicioEntrenador],
        ['socios', 'Atletas', 'users', 'Estado de vigencia de los socios', vistaSocios],
        ['asistencias', 'Asistencias', 'check', 'Historial de asistencia a sala', vistaAsistencias],
        ['observaciones', 'Observaciones', 'note', 'Seguimiento técnico privado y compartido', vistaObservaciones],
    ],
    cliente: [
        ['inicio', 'Mi Pulso', 'home', 'Tu pase digital, días restantes y progreso', inicioCliente],
        ['perfil', 'Mi Perfil', 'user', 'Tu información personal y datos de contacto', vistaPerfil],
        ['membresia', 'Mi Membresía', 'card', 'Detalle de tus planes adquiridos', vistaMembresia],
        ['asistencias', 'Mis Asistencias', 'check', 'Registro de tus días de entrenamiento', vistaAsistencias],
        ['pagos', 'Mis Pagos', 'cash', 'Comprobantes y pagos registrados', vistaPagos],
        ['cuenta', 'Configuración', 'gear', 'Gestiona tus datos personales y tu acceso', vistaCuenta],
    ],
};

async function abrirVista(item) {
    vistaActual = item;
    document.querySelectorAll('#menu li').forEach((li) => li.classList.toggle('active', li.dataset.clave === item[0]));
    $('vista-titulo').textContent = item[1];
    $('vista-subtitulo').textContent = item[3] || '';
    $('vista').innerHTML = '<p class="vacio">Cargando panel...</p>';
    try {
        $('vista').innerHTML = await item[4]();
    } catch (err) {
        console.error(err);
        $('vista').innerHTML = `<p class="msg-error">No se pudo cargar la información: ${esc(err.message || err)}</p>`;
    }
}

// ------------------------------------------------------------
// Autenticación y Perfil
// ------------------------------------------------------------
togglePasswordBtn.addEventListener('click', () => {
    const showPassword = passwordInput.type === 'password';
    passwordInput.type = showPassword ? 'text' : 'password';
    togglePasswordBtn.classList.toggle('is-visible', showPassword);
    togglePasswordBtn.setAttribute('aria-label', showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
    togglePasswordBtn.setAttribute('aria-pressed', String(showPassword));
});

function mostrarError(msg) {
    loginError.textContent = msg;
    loginError.classList.add('visible');
}

async function cargarPerfil() {
    try {
        const { data, error } = await supabaseClient.rpc('mi_perfil');
        if (error) throw error;
        if (!data || !data.length || !MENUS[data[0].out_rol]) throw new Error('Tu cuenta no tiene un perfil activo en PULSO.');
        perfil = { id: data[0].out_id, rol: data[0].out_rol, nombre: data[0].out_nombre };
        mostrarDashboard();
    } catch (err) {
        console.error(err);
        await supabaseClient.auth.signOut();
        perfil = null;
        mostrarLogin();
        mostrarError('❌ ' + (err.message || 'No se pudo obtener tu perfil.'));
    }
}

async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) cargarPerfil();
    else mostrarLogin();
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.remove('visible');
    loginError.textContent = '';
    const originalBtnText = loginBtn.textContent;
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="spinner"></span> Procesando...';
    try {
        const { error } = await supabaseClient.auth.signInWithPassword({
            email: $('email').value,
            password: $('password').value,
        });
        if (error) mostrarError('❌ Correo o contraseña incorrectos.');
        else await cargarPerfil();
    } catch (err) {
        mostrarError('❌ Error de conexión. Revisa tu internet.');
        console.error(err);
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = originalBtnText;
    }
});

logoutBtn.addEventListener('click', abrirModalCerrarSesion);

function mostrarDashboard() {
    loginContainer.classList.add('hidden');
    dashboardContainer.classList.remove('hidden');
    dashboardContainer.classList.remove('dashboard-enter');
    void dashboardContainer.offsetWidth;
    dashboardContainer.classList.add('dashboard-enter');

    $('user-nombre').textContent = perfil.nombre || '';
    const rolBadge = $('user-rol');
    rolBadge.textContent = perfil.rol;
    rolBadge.className = `rol-badge rol-${perfil.rol}`;
    $('fecha-actual').textContent = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' });

    const menu = $('menu');
    menu.innerHTML = '';
    MENUS[perfil.rol].forEach((item) => {
        const li = document.createElement('li');
        li.innerHTML = `${ICONS[item[2]] || ''}<span>${esc(item[1])}</span>`;
        li.dataset.clave = item[0];
        li.addEventListener('click', () => abrirVista(item));
        menu.appendChild(li);
    });
    abrirVista(MENUS[perfil.rol][0]);
}

function mostrarLogin() {
    dashboardContainer.classList.add('hidden');
    dashboardContainer.classList.remove('dashboard-enter');
    loginContainer.classList.remove('hidden');
    $('email').value = '';
    $('password').value = '';
    passwordInput.type = 'password';
    togglePasswordBtn.classList.remove('is-visible');
}

checkSession();
