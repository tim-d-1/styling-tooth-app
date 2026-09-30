import { useState, useEffect, type FC, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import { useFileDropAndPaste } from '@/hooks/useFileDropAndPaste';
import { supabase } from '@/lib/supabase';
import { createTicket } from './support_store';
import type { SupportCategory, TicketUrgency } from './support_types';

export interface CreateTicketPageProps {
  onHomeClick?: () => void;
  onProfileClick?: () => void;
  onSuccess?: (ticketId: string) => void;
  onToast?: (msg: string) => void;
  initialPets?: Array<{ id: string; name: string; breed?: string | null }>;
  initialAppointments?: Array<{
    id: string;
    starts_at: string;
    price?: number | null;
    service?: { name: string } | null;
    pet?: { name: string } | null;
  }>;
}

interface UserPetOption {
  id: string;
  name: string;
  breed?: string | null;
  species?: string;
  avatar_url?: string | null;
}

interface UserAppointmentOption {
  id: string;
  starts_at: string;
  price?: number | null;
  service?: { name: string } | null;
  pet?: { name: string } | null;
}

export const CreateTicketPage: FC<CreateTicketPageProps> = ({
  onHomeClick,
  onProfileClick,
  onSuccess,
  onToast,
  initialPets,
  initialAppointments,
}) => {
  const navigate = useNavigate();

  const [userName, setUserName] = useState('');
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [pets, setPets] = useState<UserPetOption[]>(initialPets || []);
  const [appointments, setAppointments] = useState<UserAppointmentOption[]>(
    initialAppointments || []
  );

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<SupportCategory>('booking');
  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [selectedAppointmentId, setSelectedAppointmentId] =
    useState<string>('');
  const [urgency, setUrgency] = useState<TicketUrgency>('normal');
  const [description, setDescription] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(
    null
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    subject?: string;
    description?: string;
  }>({});

  const { isDragging, dragProps } = useFileDropAndPaste({
    onFileSelect: (file) => {
      setAttachedFile(file);
      if (file.type.startsWith('image/')) {
        setAttachmentPreview(URL.createObjectURL(file));
      } else {
        setAttachmentPreview(null);
      }
    },
    accept: 'image/*,.pdf,.doc,.docx,.txt',
  });

  const showToast = (message: string) => {
    if (onToast) {
      onToast(message);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const sessionUser = sessionData?.session?.user;
        if (!sessionUser || !isMounted) return;

        setIsLoggedIn(true);

        const currentUserId = sessionUser.id;
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', currentUserId)
          .maybeSingle();

        if (isMounted) {
          const resolvedName =
            profile?.full_name?.trim() ||
            sessionUser.user_metadata?.first_name ||
            sessionUser.user_metadata?.full_name ||
            sessionUser.user_metadata?.name ||
            'Користувач';

          const rawAvatar =
            profile?.avatar_url ||
            sessionUser.user_metadata?.avatar_url ||
            sessionUser.user_metadata?.picture ||
            null;

          setUserName(resolvedName);
          if (rawAvatar && typeof rawAvatar === 'string') {
            setUserAvatarUrl(rawAvatar.trim());
          }
        }

        if (!initialPets) {
          const { data: petsData } = await supabase
            .from('pets')
            .select('id, name, breed, species')
            .eq('owner_id', currentUserId)
            .eq('is_active', true)
            .order('name', { ascending: true });

          if (isMounted && petsData) {
            setPets(petsData);
          }
        }

        if (!initialAppointments) {
          const { data: apptsData } = await supabase
            .from('appointments')
            .select(`
              id,
              starts_at,
              price,
              service:services!appointments_service_id_fkey(name),
              pet:pets(name)
            `)
            .eq('client_id', currentUserId)
            .neq('status', 'cancelled')
            .order('starts_at', { ascending: false });

          if (isMounted && apptsData) {
            setAppointments(apptsData as unknown as UserAppointmentOption[]);
          }
        }
      } catch {}
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [initialPets, initialAppointments]);

  const handleHomeClick = () => {
    if (onHomeClick) {
      onHomeClick();
    } else {
      navigate('/main');
    }
  };

  const handleSupportBreadcrumbClick = () => {
    navigate('/support/chat');
  };

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick();
    } else {
      navigate('/profile');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      if (file.type.startsWith('image/')) {
        setAttachmentPreview(URL.createObjectURL(file));
      } else {
        setAttachmentPreview(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    setAttachmentPreview(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const validationErrors: { subject?: string; description?: string } = {};
    if (!subject.trim()) {
      validationErrors.subject = "Будь ласка, вкажіть тему звернення";
    }
    if (!description.trim()) {
      validationErrors.description = "Будь ласка, опишіть вашу проблему";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const selectedPet = pets.find((p) => p.id === selectedPetId);
      const selectedAppt = appointments.find(
        (a) => a.id === selectedAppointmentId
      );

      let apptDateFormatted: string | null = null;
      let apptServices: string | null = null;
      let apptPrice: number | null = null;

      if (selectedAppt) {
        try {
          const date = new Date(selectedAppt.starts_at);
          apptDateFormatted = date.toLocaleString('uk-UA', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
          });
        } catch {
          apptDateFormatted = selectedAppt.starts_at;
        }

        apptServices = selectedAppt.service?.name || null;
        apptPrice = selectedAppt.price ?? null;
      }

      const ticket = await createTicket({
        subject: subject.trim(),
        category,
        urgency,
        description: description.trim(),
        petId: selectedPet?.id || null,
        petName: selectedPet?.name || null,
        petBreed: selectedPet?.breed || null,
        appointmentId: selectedAppt?.id || null,
        appointmentDateFormatted: apptDateFormatted,
        appointmentServices: apptServices,
        appointmentPrice: apptPrice,
        attachmentName: attachedFile?.name || null,
        attachmentUrl: attachmentPreview || undefined,
      });

      showToast('Звернення успішно створено');

      if (onSuccess) {
        onSuccess(ticket.id);
      } else {
        navigate(`/support/chat?ticketId=${ticket.id}`);
      }
    } catch {
      showToast('Помилка при створенні звернення');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-cream text-content-dark font-primary">
      <Header
        isLoggedIn={isLoggedIn}
        userName={userName}
        userAvatarUrl={userAvatarUrl || undefined}
        onProfileClick={handleProfileClick}
        onNavClick={(nav) => {
          if (nav === 'home') handleHomeClick();
        }}
      />

      <main className="flex-1 w-full max-w-[75rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        <nav
          aria-label="Хлібні крихти"
          className="flex items-center gap-2 text-sm text-content-dark/60 font-medium"
        >
          <button
            type="button"
            onClick={handleHomeClick}
            className="hover:text-terracotta transition-colors cursor-pointer"
          >
            Головна
          </button>
          <Icon
            name="fi-rr-angle-small-right"
            size={12}
            className="text-text-muted"
          />
          <button
            type="button"
            onClick={handleSupportBreadcrumbClick}
            className="hover:text-terracotta transition-colors cursor-pointer"
          >
            Служба підтримки
          </button>
          <Icon
            name="fi-rr-angle-small-right"
            size={12}
            className="text-text-muted"
          />
          <span className="text-terracotta font-medium">Нове звернення</span>
        </nav>

        <section className="w-full max-w-[48rem] mx-auto bg-white rounded-3xl p-6 sm:p-10 shadow-xs border border-visit-gray/50 flex flex-col gap-8">
          <div>
            <h1 className="font-accented font-bold text-2xl sm:text-3xl text-content-dark">
              Створити нове звернення
            </h1>
            <p className="font-primary text-sm text-content-dark/70 mt-1">
              Опишіть ситуацію, і наші спеціалісти допоможуть вам у найкоротший термін.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="ticket-subject"
                className="font-medium text-sm text-content-dark"
              >
                Тема звернення <span className="text-terracotta">*</span>
              </label>
              <input
                id="ticket-subject"
                type="text"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  if (errors.subject) setErrors((prev) => ({ ...prev, subject: undefined }));
                }}
                placeholder="Коротко опишіть суть питання"
                className={`w-full px-4 py-3 rounded-xl border font-primary text-sm transition-colors outline-none focus:border-terracotta ${
                  errors.subject ? 'border-status-error' : 'border-visit-gray bg-surface-cream/50'
                }`}
              />
              {errors.subject && (
                <span className="text-xs text-status-error font-medium">
                  {errors.subject}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="ticket-category"
                  className="font-medium text-sm text-content-dark"
                >
                  Категорія
                </label>
                <select
                  id="ticket-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SupportCategory)}
                  className="w-full px-4 py-3 rounded-xl border border-visit-gray bg-surface-cream/50 font-primary text-sm transition-colors outline-none focus:border-terracotta cursor-pointer"
                >
                  <option value="booking">Запис на прийом</option>
                  <option value="services">Послуги салону</option>
                  <option value="payment">Оплата та бонуси</option>
                  <option value="transfer">Pet-трансфер</option>
                  <option value="other">Інше</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="ticket-urgency"
                  className="font-medium text-sm text-content-dark"
                >
                  Терміновість
                </label>
                <select
                  id="ticket-urgency"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as TicketUrgency)}
                  className="w-full px-4 py-3 rounded-xl border border-visit-gray bg-surface-cream/50 font-primary text-sm transition-colors outline-none focus:border-terracotta cursor-pointer"
                >
                  <option value="normal">Звичайна</option>
                  <option value="urgent">Термінова</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="ticket-pet"
                  className="font-medium text-sm text-content-dark"
                >
                  Улюбленець
                </label>
                <select
                  id="ticket-pet"
                  value={selectedPetId}
                  onChange={(e) => setSelectedPetId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-visit-gray bg-surface-cream/50 font-primary text-sm transition-colors outline-none focus:border-terracotta cursor-pointer"
                >
                  <option value="">Без прив'язки</option>
                  {pets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} {pet.breed ? `(${pet.breed})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="ticket-appointment"
                  className="font-medium text-sm text-content-dark"
                >
                  Пов'язаний візит
                </label>
                <select
                  id="ticket-appointment"
                  value={selectedAppointmentId}
                  onChange={(e) => setSelectedAppointmentId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-visit-gray bg-surface-cream/50 font-primary text-sm transition-colors outline-none focus:border-terracotta cursor-pointer"
                >
                  <option value="">Без прив'язки</option>
                  {appointments.map((appt) => {
                    const formattedDate = new Date(appt.starts_at).toLocaleDateString('uk-UA', {
                      day: 'numeric',
                      month: 'short',
                    });
                    const serviceName = appt.service?.name || 'Візит';
                    return (
                      <option key={appt.id} value={appt.id}>
                        {formattedDate} - {serviceName}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="ticket-description"
                className="font-medium text-sm text-content-dark"
              >
                Опис проблеми <span className="text-terracotta">*</span>
              </label>
              <textarea
                id="ticket-description"
                rows={5}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) {
                    setErrors((prev) => ({ ...prev, description: undefined }));
                  }
                }}
                placeholder="Детально розкажіть, що сталося або яке запитання у вас виникло..."
                className={`w-full px-4 py-3 rounded-xl border font-primary text-sm transition-colors outline-none focus:border-terracotta resize-y ${
                  errors.description ? 'border-status-error' : 'border-visit-gray bg-surface-cream/50'
                }`}
              />
              {errors.description && (
                <span className="text-xs text-status-error font-medium">
                  {errors.description}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-medium text-sm text-content-dark">
                Додати файл / фото
              </label>

              <div
                {...dragProps}
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-colors text-center cursor-pointer ${
                  isDragging
                    ? 'border-terracotta bg-terracotta/5'
                    : 'border-visit-gray hover:border-terracotta/50 bg-surface-cream/30'
                }`}
                onClick={() => {
                  const input = document.getElementById('ticket-file-input');
                  input?.click();
                }}
              >
                <input
                  id="ticket-file-input"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />

                <div className="w-12 h-12 rounded-full bg-terracotta/10 flex items-center justify-center text-terracotta">
                  <Icon name="fi-rr-clip" size={20} />
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-sm text-content-dark">
                    Натисніть або перетягніть файл сюди
                  </span>
                  <span className="text-xs text-content-dark/60">
                    PNG, JPG, PDF або DOC (до 10 МБ)
                  </span>
                </div>
              </div>

              {attachedFile && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-visit-gray/60 border border-visit-gray">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {attachmentPreview ? (
                      <img
                        src={attachmentPreview}
                        alt="Попередній перегляд"
                        className="w-10 h-10 rounded-lg object-cover border border-visit-gray"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-terracotta">
                        <Icon name="fi-rr-document" size={18} />
                      </div>
                    )}
                    <span className="text-xs font-medium text-content-dark truncate">
                      {attachedFile.name}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    aria-label="Видалити прикріплений файл"
                    className="p-1 hover:text-status-error text-content-dark/60 transition-colors cursor-pointer border-0 bg-transparent"
                  >
                    <Icon name="fi-rr-cross-small" size={18} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-visit-gray/60">
              <Button
                variant="outline"
                type="button"
                onClick={() => navigate('/support/chat')}
                className="w-full sm:w-auto"
              >
                Скасувати
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? 'Створення...' : 'Створити звернення'}
              </Button>
            </div>
          </form>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CreateTicketPage;
