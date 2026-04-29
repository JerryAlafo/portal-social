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
  Calendar,
  Plus,
  X,
  Pin,
  Ban,
} from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import { logout } from "@/services/auth";
import styles from "./page.module.css";
import { ConfirmModal, PromptModal, LoadingModal, SuccessModal, ErrorModal } from "./components/AdminModals";
import { ActivityChart, CategoryBars } from "./components/AdminCharts";

type ReportBadge = "spam" | "explicit" | "harassment" | "other";
type UserRole = "superuser" | "mod" | "member";

interface Report {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: ReportBadge;
  description: string | null;
  status: string;
  created_at: string;
  reporter?: {
    username: string;
    display_name: string;
    avatar_initials: string;
  };
  post?: {
    id: string;
    content: string;
    author_id: string;
    author?: {
      username: string;
      display_name: string;
    };
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

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  image_url: string | null;
  interested_count: number;
  going_count: number;
  date_color: string;
  created_at: string;
}

interface EventForm {
  title: string;
  description: string;
  date: string;
  location: string;
  date_color: string;
}

interface AnnouncementForm {
  title: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  pinned: boolean;
}

const BADGE_LABELS: Record<ReportBadge, string> = {
  spam: "Spam",
  explicit: "Explicit",
  harassment: "Assedio",
  other: "Outro",
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
  const [events, setEvents] = useState<Event[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventForm, setEventForm] = useState<EventForm>({ title: '', description: '', date: '', location: '', date_color: '#7c5cfc' });
  const [savingEvent, setSavingEvent] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [announcementForm, setAnnouncementForm] = useState<AnnouncementForm>({ title: '', content: '', status: 'draft', pinned: false });
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [monthlyPosts, setMonthlyPosts] = useState<number[]>([]);
  const [monthlyLabels, setMonthlyLabels] = useState<string[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void }>({ show: false, title: '', message: '', onConfirm: () => {} });
  const [promptModal, setPromptModal] = useState<{ show: boolean; title: string; message: string; onConfirm: (value: string, duration: string) => void }>({ show: false, title: '', message: '', onConfirm: () => {} });
  const [promptValue, setPromptValue] = useState('');
  const [durationValue, setDurationValue] = useState('');
  const [successModal, setSuccessModal] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [loadingModal, setLoadingModal] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [banningUserId, setBanningUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashboardRes, usersRes] = await Promise.all([
          fetch('/api/admin/dashboard'),
          fetch(`/api/admin/users?search=${encodeURIComponent(userSearch)}&role=${userRoleFilter}`),
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
            setMonthlyPosts(dashboardJson.data.monthlyPosts || []);
            setMonthlyLabels(dashboardJson.data.monthlyLabels || []);
            setCategoryData(dashboardJson.data.categoryData || []);
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
  }, [router, userSearch, userRoleFilter]);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/events');
        if (res.ok) {
          const json = await res.json();
          setEvents(json.data || []);
        }
      } catch { /* ignore */ }
    }
    fetchEvents();
  }, []);

  const loadEvents = async () => {
    const res = await fetch('/api/events');
    if (res.ok) {
      const json = await res.json();
      setEvents(json.data || []);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventForm.title || !eventForm.date) {
      alert('Título e data são obrigatórios');
      return;
    }
    setSavingEvent(true);
    try {
      const res = await fetch('/api/events/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventForm),
      });
      if (res.ok) {
        await loadEvents();
        setShowEventModal(false);
        setEventForm({ title: '', description: '', date: '', location: '', date_color: '#7c5cfc' });
        setEditingEvent(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao criar evento');
      }
    } catch {
      alert('Erro ao comunicar com o servidor');
    } finally {
      setSavingEvent(false);
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !eventForm.title || !eventForm.date) {
      alert('Título e data são obrigatórios');
      return;
    }
    setSavingEvent(true);
    try {
      const res = await fetch('/api/events/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingEvent.id, ...eventForm }),
      });
      if (res.ok) {
        await loadEvents();
        setShowEventModal(false);
        setEventForm({ title: '', description: '', date: '', location: '', date_color: '#7c5cfc' });
        setEditingEvent(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao atualizar evento');
      }
    } catch {
      alert('Erro ao comunicar com o servidor');
    } finally {
      setSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Tens a certeza que queres eliminar este evento?')) return;
    try {
      const res = await fetch(`/api/events/admin?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEvents(prev => prev.filter(e => e.id !== id));
      }
    } catch { alert('Erro ao eliminar evento'); }
  };

  const openEventModal = (event?: Event) => {
    if (event) {
      setEditingEvent(event);
      setEventForm({
        title: event.title,
        description: event.description || '',
        date: event.date.slice(0, 16),
        location: event.location || '',
        date_color: event.date_color || '#7c5cfc',
      });
    } else {
      setEditingEvent(null);
      setEventForm({ title: '', description: '', date: '', location: '', date_color: '#7c5cfc' });
    }
    setShowEventModal(true);
  };

  const handleCreateAnnouncement = async () => {
    if (!announcementForm.title) {
      alert('Título é obrigatório');
      return;
    }
    setSavingAnnouncement(true);
    try {
      const res = await fetch('/api/announcements/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcementForm),
      });
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(prev => [data.data, ...prev]);
        setShowAnnouncementModal(false);
        setAnnouncementForm({ title: '', content: '', status: 'draft', pinned: false });
        setEditingAnnouncement(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao criar anúncio');
      }
    } catch {
      alert('Erro ao comunicar com o servidor');
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const handleUpdateAnnouncement = async () => {
    if (!editingAnnouncement || !announcementForm.title) {
      alert('Título é obrigatório');
      return;
    }
    setSavingAnnouncement(true);
    try {
      const res = await fetch('/api/announcements/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingAnnouncement.id, ...announcementForm }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(prev => prev.map(a => a.id === data.data.id ? data.data : a));
        setShowAnnouncementModal(false);
        setAnnouncementForm({ title: '', content: '', status: 'draft', pinned: false });
        setEditingAnnouncement(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao atualizar anúncio');
      }
    } catch {
      alert('Erro ao comunicar com o servidor');
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Tens a certeza que queres eliminar este anúncio?')) return;
    try {
      const res = await fetch(`/api/announcements/admin?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
      }
    } catch { alert('Erro ao eliminar anúncio'); }
  };

  const openAnnouncementModal = (ann?: Announcement) => {
    if (ann) {
      setEditingAnnouncement(ann);
      setAnnouncementForm({
        title: ann.title,
        content: ann.content || '',
        status: ann.status,
        pinned: ann.pinned,
      });
    } else {
      setEditingAnnouncement(null);
      setAnnouncementForm({ title: '', content: '', status: 'draft', pinned: false });
    }
    setShowAnnouncementModal(true);
  };

  const removeReport = (id: string) =>
    setReports((r) => r.filter((x) => x.id !== id));

  const handleDismissReport = async (reportId: string) => {
    setLoadingModal({ show: true, message: 'A ignorar denúncia...' });
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_id: reportId, action: 'dismiss' }),
      });
      setLoadingModal({ show: false, message: '' });
      if (res.ok) {
        setReports(prev => prev.filter(r => r.id !== reportId));
        setSuccessModal({ show: true, message: 'Denúncia ignorada com sucesso' });
      } else {
        const data = await res.json();
        setErrorModal({ show: true, message: data.error || 'Erro ao ignorar denúncia' });
      }
    } catch {
      setLoadingModal({ show: false, message: '' });
      setErrorModal({ show: true, message: 'Erro ao comunicar com o servidor' });
    }
  };

  const handleDeleteReportedPost = async (reportId: string, postId: string) => {
    setConfirmModal({
      show: true,
      title: 'Eliminar Publicação',
      message: 'Tens a certeza que queres eliminar esta publicação? Esta ação é irreversível.',
      onConfirm: async () => {
        setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
        setLoadingModal({ show: true, message: 'A eliminar publicação...' });
        try {
          const res = await fetch('/api/admin/reports', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ report_id: reportId, action: 'delete_post' }),
          });
          setLoadingModal({ show: false, message: '' });
          if (res.ok) {
            setReports(prev => prev.filter(r => r.id !== reportId));
            setSuccessModal({ show: true, message: 'Publicação eliminada com sucesso' });
          } else {
            const data = await res.json();
            setErrorModal({ show: true, message: data.error || 'Erro ao eliminar publicação' });
          }
        } catch {
          setLoadingModal({ show: false, message: '' });
          setErrorModal({ show: true, message: 'Erro ao comunicar com o servidor' });
        }
      },
    });
  };

  const handleBanUser = async (userId: string, userName: string) => {
    setConfirmModal({
      show: true,
      title: 'Banir Utilizador',
      message: `Tens a certeza que queres banir ${userName}?`,
      onConfirm: async () => {
        setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
        setPromptValue('');
        setDurationValue('');
        setPromptModal({
          show: true,
          title: 'Detalhes do Ban',
          message: 'Indica o motivo e a duração em dias (deixa vazio para permanente):',
          onConfirm: async (reason, duration) => {
            setPromptModal({ show: false, title: '', message: '', onConfirm: () => {} });
            const duration_days = duration ? parseInt(duration) : null;
            setBanningUserId(userId);
            setLoadingModal({ show: true, message: 'A banir utilizador...' });
            try {
              const res = await fetch('/api/admin/users/' + userId + '/ban', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, reason, duration_days }),
              });
              setLoadingModal({ show: false, message: '' });
              if (res.ok) {
                setUsers(prev => prev.filter(u => u.id !== userId));
                setSuccessModal({ show: true, message: 'Utilizador banido com sucesso' });
              } else {
                const data = await res.json();
                setErrorModal({ show: true, message: data.error || 'Erro ao banir utilizador' });
              }
            } catch {
              setLoadingModal({ show: false, message: '' });
              setErrorModal({ show: true, message: 'Erro ao comunicar com o servidor' });
            } finally {
              setBanningUserId(null);
            }
          },
        });
      },
    });
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    setConfirmModal({
      show: true,
      title: 'Eliminar Conta',
      message: `Tens a certeza que queres eliminar permanentemente a conta de ${userName}? Esta acção é irreversível.`,
      onConfirm: async () => {
        setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
        setDeletingUserId(userId);
        setLoadingModal({ show: true, message: 'A eliminar conta...' });
        try {
          const res = await fetch(`/api/admin/users/${userId}/delete`, { method: 'DELETE' });
          setLoadingModal({ show: false, message: '' });
          const data = await res.json();
          console.log('[DELETE USER] Response:', res.status, data);
          if (res.ok) {
            setUsers(prev => prev.filter(u => u.id !== userId));
            setSuccessModal({ show: true, message: 'Conta eliminada com sucesso' });
          } else {
            setErrorModal({ show: true, message: data.error || 'Erro ao eliminar conta' });
          }
        } catch (err) {
          console.log('[DELETE USER] Fetch error:', err);
          setLoadingModal({ show: false, message: '' });
          setErrorModal({ show: true, message: 'Erro ao comunicar com o servidor' });
        } finally {
          setDeletingUserId(null);
        }
      },
    });
  };

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
      <ConfirmModal
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} })}
      />
      <PromptModal
        show={promptModal.show}
        title={promptModal.title}
        message={promptModal.message}
        promptValue={promptValue}
        durationValue={durationValue}
        onPromptChange={setPromptValue}
        onDurationChange={setDurationValue}
        onConfirm={() => promptModal.onConfirm(promptValue, durationValue)}
        onCancel={() => { setPromptModal({ show: false, title: '', message: '', onConfirm: () => {} }); setPromptValue(''); setDurationValue(''); }}
      />
      <LoadingModal show={loadingModal.show} message={loadingModal.message} />
      <SuccessModal show={successModal.show} message={successModal.message} onClose={() => setSuccessModal({ show: false, message: '' })} />
      <ErrorModal show={errorModal.show} message={errorModal.message} onClose={() => setErrorModal({ show: false, message: '' })} />
      {showAnnouncementModal && (
        <div className={styles.modalOverlay} onClick={() => { setShowAnnouncementModal(false); setEditingAnnouncement(null); setAnnouncementForm({ title: '', content: '', status: 'draft', pinned: false }); }}>
          <div className={styles.eventModalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingAnnouncement ? 'Editar Anuncio' : 'Criar Anuncio'}</h3>
              <button className={styles.closeBtn} onClick={() => { setShowAnnouncementModal(false); setEditingAnnouncement(null); setAnnouncementForm({ title: '', content: '', status: 'draft', pinned: false }); }}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.formGroup}>
              <label>Titulo *</label>
              <input type="text" value={announcementForm.title} onChange={e => setAnnouncementForm(p => ({ ...p, title: e.target.value }))} placeholder="Titulo do anuncio" />
            </div>
            <div className={styles.formGroup}>
              <label>Conteudo</label>
              <textarea value={announcementForm.content} onChange={e => setAnnouncementForm(p => ({ ...p, content: e.target.value }))} placeholder="Conteudo do anuncio" rows={4} />
            </div>
            <div className={styles.formGroup}>
              <label>Estado</label>
              <select value={announcementForm.status} onChange={e => setAnnouncementForm(p => ({ ...p, status: e.target.value as AnnouncementForm['status'] }))} className={styles.selectInput}>
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={announcementForm.pinned} onChange={e => setAnnouncementForm(p => ({ ...p, pinned: e.target.checked }))} />
                <span>Fixo no topo</span>
              </label>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => { setShowAnnouncementModal(false); setEditingAnnouncement(null); setAnnouncementForm({ title: '', content: '', status: 'draft', pinned: false }); }}>
                Cancelar
              </button>
              <button className={styles.saveBtn} onClick={editingAnnouncement ? handleUpdateAnnouncement : handleCreateAnnouncement} disabled={savingAnnouncement}>
                {savingAnnouncement ? <Loader2 size={14} className="animate-spin" /> : (editingAnnouncement ? 'Guardar' : 'Criar Anuncio')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEventModal && (
        <div className={styles.modalOverlay} onClick={() => { setShowEventModal(false); setEditingEvent(null); setEventForm({ title: '', description: '', date: '', location: '', date_color: '#7c5cfc' }); }}>
          <div className={styles.eventModalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingEvent ? 'Editar Evento' : 'Criar Evento'}</h3>
              <button className={styles.closeBtn} onClick={() => { setShowEventModal(false); setEditingEvent(null); setEventForm({ title: '', description: '', date: '', location: '', date_color: '#7c5cfc' }); }}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.formGroup}>
              <label>Titulo *</label>
              <input type="text" value={eventForm.title} onChange={e => setEventForm(p => ({ ...p, title: e.target.value }))} placeholder="Nome do evento" />
            </div>
            <div className={styles.formGroup}>
              <label>Descricao</label>
              <textarea value={eventForm.description} onChange={e => setEventForm(p => ({ ...p, description: e.target.value }))} placeholder="Descricao do evento" rows={3} />
            </div>
            <div className={styles.formGroup}>
              <label>Data *</label>
              <input type="datetime-local" value={eventForm.date} onChange={e => setEventForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div className={styles.formGroup}>
              <label>Localizacao</label>
              <input type="text" value={eventForm.location} onChange={e => setEventForm(p => ({ ...p, location: e.target.value }))} placeholder="Local do evento" />
            </div>
            <div className={styles.formGroup}>
              <label>Cor do cartaz</label>
              <div className={styles.colorPicker}>
                {/* <div className={styles.colorPreview} style={{ background: eventForm.date_color }} /> */}
                <input type="text" value={eventForm.date_color} onChange={e => setEventForm(p => ({ ...p, date_color: e.target.value }))} placeholder="#7c5cfc" />
                <input type="color" value={eventForm.date_color} onChange={e => setEventForm(p => ({ ...p, date_color: e.target.value }))} className={styles.colorInput} />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => { setShowEventModal(false); setEditingEvent(null); setEventForm({ title: '', description: '', date: '', location: '', date_color: '#7c5cfc' }); }}>
                Cancelar
              </button>
              <button className={styles.saveBtn} onClick={editingEvent ? handleUpdateEvent : handleCreateEvent} disabled={savingEvent}>
                {savingEvent ? <Loader2 size={14} className="animate-spin" /> : (editingEvent ? 'Guardar' : 'Criar Evento')}
              </button>
            </div>
          </div>
        </div>
      )}

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

        {/* Activity Charts */}
        <div className={styles.twoCol}>
          <ActivityChart monthlyPosts={monthlyPosts} monthlyLabels={monthlyLabels} />
          <CategoryBars data={categoryData} />
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
                  {r.reporter && (
                    <div className={styles.reportMeta}>
                      Denunciado por <strong>@{r.reporter.username}</strong>
                    </div>
                  )}
                  {r.post?.content && (
                    <div className={styles.reportPostContent}>
                      "{r.post.content.length > 120 ? r.post.content.slice(0, 120) + '...' : r.post.content}"
                    </div>
                  )}
                  {r.description && (
                    <div className={styles.reportText}>{r.description}</div>
                  )}
                  <div className={styles.reportMeta}>
                    {formatRelativeTime(r.created_at)}
                  </div>
                </div>
                <div className={styles.reportActions}>
                  <button
                    className={styles.btnDelete}
                    onClick={() => handleDeleteReportedPost(r.id, r.post_id)}
                  >
                    <Trash2 size={13} /> Apagar post
                  </button>
                  <button
                    className={styles.btnWarn}
                    onClick={() => handleDismissReport(r.id)}
                  >
                    <AlertCircle size={13} /> Ignorar
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
                <button className={styles.addBtn} onClick={() => openAnnouncementModal()}>
                  <Plus size={14} /> Novo Anuncio
                </button>
              </div>
              {announcements.length === 0 ? (
                <div className={styles.emptyState}>
                  <Megaphone size={24} color="var(--text3)" />
                  <p>Nenhum anuncio.</p>
                </div>
              ) : (
                announcements.map((a) => (
                  <div key={a.id} className={styles.announceItemFull}>
                    <div className={styles.announceLeft}>
                      <div className={styles.announceTitle}>
                        {a.pinned && <Pin size={12} className={styles.pinIcon} />}{a.title}
                      </div>
                      {a.content && <div className={styles.announceContent}>{a.content}</div>}
                      <div className={styles.announceMeta}>{formatRelativeTime(a.created_at)}</div>
                    </div>
                    <div className={styles.announceRight}>
                      <span className={`${styles.announceStatus} ${styles[`status_${a.status}`]}`}>
                        {a.status === 'published' ? 'Publicado' : a.status === 'draft' ? 'Rascunho' : 'Arquivado'}
                      </span>
                      <div className={styles.announceActions}>
                        <button className={styles.editBtn} onClick={() => openAnnouncementModal(a)}>Editar</button>
                        <button className={styles.deleteBtn} onClick={() => handleDeleteAnnouncement(a.id)}>Eliminar</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Events */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Eventos</span>
            <button className={styles.addBtn} onClick={() => openEventModal()}>
              <Plus size={14} /> Novo Evento
            </button>
          </div>
          {events.length === 0 ? (
            <div className={styles.emptyState}>
              <Calendar size={24} color="var(--text3)" />
              <p>Nenhum evento criado.</p>
            </div>
          ) : (
            <div className={styles.eventsGrid}>
              {events.map(ev => {
                const eventDate = new Date(ev.date);
                const dateStr = eventDate.toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
                return (
                  <div key={ev.id} className={styles.eventCard} style={{ borderLeftColor: ev.date_color || '#7c5cfc' }}>
                    <div className={styles.eventDate} style={{ color: ev.date_color || '#7c5cfc' }}>{dateStr}</div>
                    <div className={styles.eventTitle}>{ev.title}</div>
                    {ev.location && <div className={styles.eventLocation}>{ev.location}</div>}
                    <div className={styles.eventStats}>
                      <span>{ev.interested_count} interessados</span>
                      <span>{ev.going_count} vao</span>
                    </div>
                    <div className={styles.eventActions}>
                      <button className={styles.editBtn} onClick={() => openEventModal(ev)}>Editar</button>
                      <button className={styles.deleteBtn} onClick={() => handleDeleteEvent(ev.id)}>Eliminar</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Users table */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>
              Gestao de membros e permissoes
            </span>
            <span className={styles.badgeAmber}>{formatStatNumber(totalMembers)} membros</span>
          </div>
          <div className={styles.userFilters}>
            <input
              type="text"
              placeholder="Pesquisar membros..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className={styles.searchInput}
            />
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Todos</option>
              <option value="superuser">Superusers</option>
              <option value="mod">Mods</option>
              <option value="member">Membros</option>
            </select>
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
                          <button className={styles.btnBan} onClick={() => handleBanUser(u.id, u.name)} disabled={banningUserId === u.id}>
                                {banningUserId === u.id ? <Loader2 size={12} className="animate-spin" /> : "Ban"}
                              </button>
                              <button className={styles.btnDelete} onClick={() => handleDeleteUser(u.id, u.name)} disabled={deletingUserId === u.id} style={{ marginLeft: 4 }}>
                                {deletingUserId === u.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                              </button>
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
