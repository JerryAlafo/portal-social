"use client";

import { useState } from "react";
import {
  Users,
  FileText,
  ShieldOff,
  Megaphone,
  BarChart2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Trash2,
  AlertCircle,
} from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import styles from "./page.module.css";

type ReportBadge = "spam" | "explicit" | "harassment";
type UserRole = "superuser" | "mod" | "member";

interface Report {
  id: string;
  initials: string;
  bg: string;
  color: string;
  name: string;
  badge: ReportBadge;
  text: string;
  time: string;
  count: number;
}

interface ManagedUser {
  id: string;
  initials: string;
  bg: string;
  color: string;
  name: string;
  handle: string;
  role: UserRole;
  online: boolean;
  posts: string;
  since: string;
}

const initialReports: Report[] = [
  {
    id: "r1",
    initials: "SP",
    bg: "#1a0010",
    color: "#fc5c7d",
    name: "SpamBott01",
    badge: "explicit",
    text: "Conteudo impróprio com links de phishing publicados no feed...",
    time: "Ha 12 min",
    count: 4,
  },
  {
    id: "r2",
    initials: "US",
    bg: "#1a1000",
    color: "#fcb45c",
    name: "User_34521",
    badge: "spam",
    text: "Publicou o mesmo conteudo 8 vezes em 10 minutos...",
    time: "Ha 28 min",
    count: 2,
  },
  {
    id: "r3",
    initials: "TK",
    bg: "#0a0a2a",
    color: "#7c5cfc",
    name: "TakeshiK",
    badge: "harassment",
    text: "Comentarios ofensivos repetidos no perfil de outro utilizador...",
    time: "Ha 1 hora",
    count: 6,
  },
  {
    id: "r4",
    initials: "RX",
    bg: "#0a2015",
    color: "#5cfcb4",
    name: "RandUser99",
    badge: "spam",
    text: "Publicidade nao autorizada a servico externo...",
    time: "Ha 2 horas",
    count: 1,
  },
];

const initialUsers: ManagedUser[] = [
  {
    id: "u0",
    initials: "PO",
    bg: "#1a0030",
    color: "#e879f9",
    name: "PortalAdmin",
    handle: "@portal_admin",
    role: "superuser",
    online: true,
    posts: "1.8k",
    since: "Jan 2025",
  },
  {
    id: "u1",
    initials: "JA",
    bg: "#12092a",
    color: "#9b7fff",
    name: "Jerry Otaku",
    handle: "@jalafo",
    role: "superuser",
    online: true,
    posts: "1.2k",
    since: "Fev 2025",
  },
  {
    id: "u2",
    initials: "YS",
    bg: "#1a1000",
    color: "#fcb45c",
    name: "YukiSenpai",
    handle: "@yukisenpai",
    role: "mod",
    online: true,
    posts: "876",
    since: "Mar 2025",
  },
  {
    id: "u3",
    initials: "AK",
    bg: "#0a2015",
    color: "#5cfcb4",
    name: "AkiraFan99",
    handle: "@akirafan99",
    role: "member",
    online: false,
    posts: "342",
    since: "Abr 2025",
  },
  {
    id: "u4",
    initials: "SH",
    bg: "#1a0010",
    color: "#fc5c7d",
    name: "SakuraHime",
    handle: "@sakurahime",
    role: "member",
    online: true,
    posts: "523",
    since: "Mai 2025",
  },
];

const BADGE_LABELS: Record<ReportBadge, string> = {
  spam: "Spam",
  explicit: "Explicit",
  harassment: "Assedio",
};
const ROLE_LABELS: Record<UserRole, string> = {
  superuser: "Super User",
  mod: "Moderador",
  member: "Membro",
};

export default function AdminPage() {
  const [reports, setReports] = useState(initialReports);
  const [users, setUsers] = useState(initialUsers);

  const removeReport = (id: string) =>
    setReports((r) => r.filter((x) => x.id !== id));

  const cycleRole = (id: string, direction: "up" | "down") => {
    const order: UserRole[] = ["member", "mod", "superuser"];
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const idx = order.indexOf(u.role);
        const newIdx =
          direction === "up" ? Math.min(idx + 1, 2) : Math.max(idx - 1, 0);
        return { ...u, role: order[newIdx] };
      }),
    );
  };

  const bars = [35, 55, 45, 80, 65, 90, 100];
  const barDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Hoje"];

  return (
    <div className={styles.page}>
      <Topbar title="Administracao" />

      <div className={styles.body}>
        {/* Stats */}
        <div className={styles.statsRow}>
          {[
            {
              label: "Membros",
              value: "24.8k",
              change: "+342 esta semana",
              up: true,
              icon: <Users size={16} />,
            },
            {
              label: "Publicacoes",
              value: "187k",
              change: "+1.4k hoje",
              up: true,
              icon: <FileText size={16} />,
            },
            {
              label: "Denuncias activas",
              value: String(reports.length),
              change: "+3 nas ultimas 24h",
              up: false,
              icon: <ShieldOff size={16} />,
              danger: true,
            },
            {
              label: "Banimentos",
              value: "12",
              change: "Este mes",
              neutral: true,
              icon: <AlertTriangle size={16} />,
            },
          ].map((s) => (
            <div key={s.label} className={styles.statCard}>
              <div className={styles.statTop}>
                <span className={styles.statLabel}>{s.label}</span>
                <span
                  style={{ color: s.danger ? "var(--red)" : "var(--text3)" }}
                >
                  {s.icon}
                </span>
              </div>
              <div
                className={`${styles.statValue} ${s.danger ? styles.statDanger : ""}`}
              >
                {s.value}
              </div>
              <div
                className={`${styles.statChange} ${s.up ? styles.changeUp : s.neutral ? "" : styles.changeDown}`}
              >
                {s.up ? (
                  <TrendingUp size={12} />
                ) : s.neutral ? null : (
                  <TrendingDown size={12} />
                )}
                {s.change}
              </div>
            </div>
          ))}
        </div>

        {/* Two col */}
        <div className={styles.twoCol}>
          {/* Reports */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Publicacoes denunciadas</span>
              <span className={styles.badgeDanger}>
                {reports.length} pendentes
              </span>
            </div>
            {reports.length === 0 && (
              <div className={styles.emptyState}>
                <CheckCircle size={24} color="var(--green)" />
                <p>Nenhuma denuncia pendente.</p>
              </div>
            )}
            {reports.map((r) => (
              <div key={r.id} className={styles.reportItem}>
                <div
                  className={styles.reportAvatar}
                  style={{ background: r.bg, color: r.color }}
                >
                  {r.initials}
                </div>
                <div className={styles.reportInfo}>
                  <div className={styles.reportName}>
                    {r.name}
                    <span
                      className={`${styles.reportBadge} ${styles[`badge_${r.badge}`]}`}
                    >
                      {BADGE_LABELS[r.badge]}
                    </span>
                  </div>
                  <div className={styles.reportText}>{r.text}</div>
                  <div className={styles.reportMeta}>
                    {r.time} · {r.count}{" "}
                    {r.count === 1 ? "denuncia" : "denuncias"}
                  </div>
                </div>
                <div className={styles.reportActions}>
                  <button
                    className={styles.btnDelete}
                    onClick={() => removeReport(r.id)}
                  >
                    <Trash2 size={13} /> Apagar
                  </button>
                  <button className={styles.btnWarn}>
                    <AlertCircle size={13} /> Avisar
                  </button>
                  <button className={styles.btnKeep}>
                    <CheckCircle size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Right mini cards */}
          <div className={styles.miniCol}>
            <div className={styles.card}>
              <div className={styles.cardTitle} style={{ marginBottom: 16 }}>
                Actividade (7 dias)
              </div>
              <div className={styles.miniChart}>
                {bars.map((h, i) => (
                  <div
                    key={i}
                    className={`${styles.bar} ${i === 6 ? styles.barToday : ""}`}
                    style={{ height: `${h}%` }}
                    title={barDays[i]}
                  />
                ))}
              </div>
              <div className={styles.chartLabels}>
                {barDays.map((d, i) => (
                  <span key={d} className={i === 6 ? styles.labelToday : ""}>
                    {d}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Anuncios</span>
                <span className={styles.badgeGreen}>2 activos</span>
              </div>
              {[
                {
                  title: "Boas-vindas ao PORTAL Beta",
                  meta: "Ha 2 horas",
                  status: "pinned",
                  statusLabel: "Fixado",
                },
                {
                  title: "Lisboa Anime Fest 2026",
                  meta: "Ha 1 dia",
                  status: "published",
                  statusLabel: "Publicado",
                },
                {
                  title: "Novas regras da comunidade",
                  meta: "Rascunho",
                  status: "draft",
                  statusLabel: "Rascunho",
                },
              ].map((a) => (
                <div key={a.title} className={styles.announceItem}>
                  <div className={styles.announceInfo}>
                    <div className={styles.announceTitle}>{a.title}</div>
                    <div className={styles.announceMeta}>{a.meta}</div>
                  </div>
                  <span
                    className={`${styles.announceStatus} ${styles[`status_${a.status}`]}`}
                  >
                    {a.statusLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Users table */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>
              Gestao de membros e permissoes
            </span>
            <span className={styles.badgeAmber}>3 pedidos pendentes</span>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Membro</th>
                  <th>Funcao</th>
                  <th>Estado</th>
                  <th>Posts</th>
                  <th>Registo</th>
                  <th>Accoes</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td data-label="Membro">
                      <div className={styles.userCell}>
                        <div
                          className={styles.userAvatar}
                          style={{ background: u.bg, color: u.color }}
                        >
                          {u.initials}
                        </div>
                        <div>
                          <div className={styles.userName}>{u.name}</div>
                          <div className={styles.userHandle}>{u.handle}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Funcao">
                      <span
                        className={`${styles.roleBadge} ${styles[`role_${u.role}`]}`}
                      >
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td data-label="Estado">
                      <span
                        className={`${styles.statusDot} ${u.online ? styles.dotOnline : styles.dotOffline}`}
                      />
                      <span style={{ fontSize: 12, color: "var(--text3)" }}>
                        {u.online ? "Online" : "Offline"}
                      </span>
                    </td>
                    <td data-label="Posts" className={styles.tdMuted}>
                      {u.posts}
                    </td>
                    <td data-label="Registo" className={styles.tdFaint}>
                      {u.since}
                    </td>
                    <td data-label="Accoes">
                      {u.id === "u0" ? (
                        <span className={styles.ownerLabel}>Proprietario</span>
                      ) : (
                        <div className={styles.tableBtns}>
                          {u.role !== "superuser" && (
                            <button
                              className={styles.btnPromote}
                              onClick={() => cycleRole(u.id, "up")}
                            >
                              {u.role === "mod" ? "Tornar SU" : "Tornar Mod"}
                            </button>
                          )}
                          {u.role !== "member" && (
                            <button
                              className={styles.btnDemote}
                              onClick={() => cycleRole(u.id, "down")}
                            >
                              Rebaixar
                            </button>
                          )}
                          <button className={styles.btnBan}>Ban</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
