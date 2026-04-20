"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  FileText,
  ShieldOff,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Trash2,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Megaphone,
} from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import { logout } from "@/services/auth";
import styles from "./page.module.css";

type ReportBadge = "spam" | "explicit" | "harassment";
type UserRole = "superuser" | "mod" | "member";

interface Report {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: ReportBadge;
  description: string | null;
  created_at: string;
  reporter?: {
    username: string;
    display_name: string;
    avatar_initials: string;
  };
}

interface Announcement {
  id: string;
  title: string;
  content: string | null;
  status: "draft" | "published" | "archived";
  pinned: boolean;
  created_at: string;
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

interface ApiUser {
  id: string;
  username: string;
  display_name: string;
  avatar_initials: string;
  avatar_url: string | null;
  role: UserRole;
  is_online: boolean;
  posts_count: number;
  created_at: string;
}

interface DashboardData {
  reports: Report[];
  totalReports: number;
  reportsLast24h: number;
  announcements: Announcement[];
  totalAnnouncements: number;
  postsToday: number;
  dailyPosts: number[];
  dailyLabels: string[];
  activeAnnouncements: number;
}

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

const AVATAR_COLORS = [
  "#1a0030", "#12092a", "#1a1000", "#0a2015", "#1a0010",
  "#0a0a2a", "#001a1a", "#1a0a1a", "#0a1a1a", "#1a1a00",
];
const AVATAR_TEXT_COLORS = [
  "#e879f9", "#9b7fff", "#fcb45c", "#5cfcb4", "#fc5c7d",
  "#7c5cfc", "#5cfcfc", "#fc7c5c", "#5cffc7", "#fcfc5c",
];

function getAvatarStyle(index: number) {
  return {
    bg: AVATAR_COLORS[index % AVATAR_COLORS.length],
    color: AVATAR_TEXT_COLORS[index % AVATAR_TEXT_COLORS.length],
  };
}

function formatPostsCount(count: number): string {
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return String(count);
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Agora";
  if (minutes < 60) return `Há ${minutes} min`;
  if (hours < 24) return `Há ${hours} hora${hours > 1 ? 's' : ''}`;
  if (days < 7) return `Há ${days} dia${days > 1 ? 's' : ''}`;

  return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
  
  if (months < 1) return "Este mês";
  if (months === 1) return "Mês passado";
  if (months < 12) return `Há ${months} meses`;
  
  return date.toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' });
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dailyPosts, setDailyPosts] = useState<number[]>([]);
  const [dailyLabels, setDailyLabels] = useState<string[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  const [reportsLast24h, setReportsLast24h] = useState(0);
  const [activeAnnouncements, setActiveAnnouncements] = useState(0);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashboardRes, usersRes] = await Promise.all([
          fetch('/api/admin/dashboard'),
          fetch('/api/admin/users'),
        ]);

        if (!usersRes.ok) {
          if (usersRes.status === 403) {
            setAccessDenied(true);
            setLoading(false);
            return;
          }
          if (usersRes.status === 401) {
            router.push('/login');
            return;
          }
        }

        if (dashboardRes.ok) {
          const dashboardJson = await dashboardRes.json();
          if (dashboardJson.data) {
            setReports(dashboardJson.data.reports || []);
            setAnnouncements(dashboardJson.data.announcements || []);
            setDailyPosts(dashboardJson.data.dailyPosts || []);
            setDailyLabels(dashboardJson.data.dailyLabels || []);
            setTotalPosts(dashboardJson.data.postsToday || 0);
            setReportsLast24h(dashboardJson.data.reportsLast24h || 0);
            setActiveAnnouncements(dashboardJson.data.activeAnnouncements || 0);
          }
        }

        if (usersRes.ok) {
          const usersJson = await usersRes.json();
          const apiUsers: ApiUser[] = usersJson.data?.users || [];
          const mapped: ManagedUser[] = apiUsers.map((u, i) => {
            const style = getAvatarStyle(i);
            return {
              id: u.id,
              initials: u.avatar_initials || u.username.substring(0, 2).toUpperCase(),
              bg: style.bg,
              color: style.color,
              name: u.display_name || u.username,
              handle: '@' + u.username,
              role: u.role,
              online: u.is_online,
              posts: formatPostsCount(u.posts_count),
              since: formatDate(u.created_at),
            };
          });

          setUsers(mapped);
          setTotalMembers(usersJson.data?.total || 0);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  const removeReport = (id: string) =>
    setReports((r) => r.filter((x) => x.id !== id));

  const cycleRole = async (id: string, direction: "up" | "down") => {
    const user = users.find(u => u.id === id);
    if (!user) return;

    const order: UserRole[] = ["member", "mod", "superuser"];
    const idx = order.indexOf(user.role);
    const newIdx = direction === "up" ? Math.min(idx + 1, 2) : Math.max(idx - 1, 0);
    const newRole = order[newIdx];

    try {
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Erro ao atualizar role');
        return;
      }

      setUsers(prev => prev.map(u => 
        u.id === id ? { ...u, role: newRole } : u
      ));
    } catch {
      alert('Erro ao comunicar com o servidor');
    }
  };
  const bars = [35, 55, 45, 80, 65, 90, 100];
  const barDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Hoje"];

  if (loading) {
    return (
      <div className={styles.page}>
        <Topbar title="Administracao" />
        <div className={styles.body} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <Topbar title="Administracao" />
        <div className={styles.body} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', flexDirection: 'column', gap: 16 }}>
          <AlertCircle size={48} color="var(--red)" />
          <p style={{ color: 'var(--text2)' }}>{error}</p>
        </div>
      </div>
    );
  }

  const formatStatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(num);
  };

  const handleCloseAccessDenied = async () => {
    setAccessDenied(false);
    await logout();
  };

  return (
    <div className={styles.page}>
      {accessDenied && (
        <div className={styles.modalOverlay} onClick={handleCloseAccessDenied}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon}>
              <ShieldAlert size={32} />
            </div>
            <div className={styles.modalTitle}>Acesso Negado</div>
            <div className={styles.modalDescription}>
              Apenas administradores (moderadores ou superusers) podem aceder a esta página.
            </div>
            <div className={styles.modalHint}>
              Contacte um administrador se precisar de acesso.
            </div>
            <button className={styles.modalButton} onClick={handleCloseAccessDenied}>
              Voltar ao Início
            </button>
          </div>
        </div>
      )}
      <Topbar title="Administracao" />

      <div className={styles.body}>
        {/* Stats */}
        <div className={styles.statsRow}>
          {[
            {
              label: "Membros",
              value: formatStatNumber(totalMembers),
              change: "Total registados",
              up: true,
              icon: <Users size={16} />,
            },
            {
              label: "Publicacoes",
              value: formatStatNumber(totalPosts),
              change: "Hoje",
              up: true,
              icon: <FileText size={16} />,
            },
            {
              label: "Denuncias activas",
              value: String(reports.length),
              change: `+${reportsLast24h} nas ultimas 24h`,
              up: reports.length > 0 ? false : true,
              icon: <ShieldOff size={16} />,
              danger: reports.length > 0,
            },
            {
              label: "Anuncios",
              value: String(activeAnnouncements),
              change: "Activos",
              neutral: true,
              icon: <Megaphone size={16} />,
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
              <span className={reports.length > 0 ? styles.badgeDanger : styles.badgeGreen}>
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
                  style={{ background: getAvatarStyle(Math.floor(Math.random() * 10)).bg, color: getAvatarStyle(Math.floor(Math.random() * 10)).color }}
                >
                  {r.reporter?.avatar_initials || r.reporter_id.slice(0, 2).toUpperCase()}
                </div>
                <div className={styles.reportInfo}>
                  <div className={styles.reportName}>
                    Denúncia #{r.id.slice(0, 6)}
                    <span
                      className={`${styles.reportBadge} ${styles[`badge_${r.reason}`]}`}
                    >
                      {BADGE_LABELS[r.reason]}
                    </span>
                  </div>
                  <div className={styles.reportText}>{r.description || `Denúncia de post ${r.post_id.slice(0, 8)}`}</div>
                  <div className={styles.reportMeta}>
                    {formatRelativeTime(r.created_at)}
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
                    <AlertCircle size={13} /> Ver
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
                {dailyPosts.length > 0 ? dailyPosts.map((h, i) => {
                  const max = Math.max(...dailyPosts, 1);
                  return (
                    <div
                      key={i}
                      className={`${styles.bar} ${i === 6 ? styles.barToday : ""}`}
                      style={{ height: `${(h / max) * 100}%` }}
                      title={`${h} posts`}
                    />
                  );
                }) : [35, 55, 45, 80, 65, 90, 100].map((h, i) => (
                  <div
                    key={i}
                    className={`${styles.bar} ${i === 6 ? styles.barToday : ""}`}
                    style={{ height: `${h}%` }}
                    title={dailyLabels[i] || ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][i]}
                  />
                ))}
              </div>
              <div className={styles.chartLabels}>
                {(dailyLabels.length > 0 ? dailyLabels : ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']).map((d, i) => (
                  <span key={d} className={i === 6 ? styles.labelToday : ""}>
                    {d}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Anuncios</span>
                <span className={activeAnnouncements > 0 ? styles.badgeGreen : styles.badgeAmber}>
                  {activeAnnouncements} activos
                </span>
              </div>
              {announcements.length === 0 ? (
                <div className={styles.emptyState}>
                  <Megaphone size={24} color="var(--text3)" />
                  <p>Nenhum anuncio.</p>
                </div>
              ) : (
                announcements.slice(0, 5).map((a) => (
                  <div key={a.id} className={styles.announceItem}>
                    <div className={styles.announceInfo}>
                      <div className={styles.announceTitle}>
                        {a.pinned && "📌 "}{a.title}
                      </div>
                      <div className={styles.announceMeta}>{formatRelativeTime(a.created_at)}</div>
                    </div>
                    <span
                      className={`${styles.announceStatus} ${styles[`status_${a.status}`]}`}
                    >
                      {a.status === 'published' ? 'Publicado' : a.status === 'draft' ? 'Rascunho' : 'Arquivado'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Users table */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>
              Gestao de membros e permissoes
            </span>
            <span className={styles.badgeAmber}>{formatStatNumber(totalMembers)} membros</span>
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
