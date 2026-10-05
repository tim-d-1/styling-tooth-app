import { useState, useEffect, type FC } from 'react';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import type { SupportTicket } from '@/features/support/support_types';
import { supabase } from '@/lib/supabase';
import { cleanClientPhone } from '@/features/requests/admin_service';

interface CustomerContextCardProps {
  ticket: SupportTicket | null;
}

export const CustomerContextCard: FC<CustomerContextCardProps> = ({ ticket }) => {
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [isLoadingPhone, setIsLoadingPhone] = useState(false);

  useEffect(() => {
    const fetchPhone = async () => {
      if (!ticket?.clientId) {
        setPhoneNumber(null);
        setIsLoadingPhone(false);
        return;
      }
      setIsLoadingPhone(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', ticket.clientId)
          .single();
          
        if (!error && data?.phone) {
          setPhoneNumber(data.phone);
        } else {
          setPhoneNumber(null);
        }
      } catch {
        setPhoneNumber(null);
      } finally {
        setIsLoadingPhone(false);
      }
    };

    fetchPhone();
  }, [ticket?.clientId]);

  if (!ticket) return null;

  const clientMessage = ticket.messages?.find(m => m.senderRole === 'client');
  const clientName = clientMessage?.senderName || 'Клієнт';
  const cleanedPhone = cleanClientPhone(phoneNumber);

  return (
    <div className="bg-white rounded-3xl border border-visit-gray/60 p-5 shadow-xs flex flex-col gap-4">
      <h3 className="font-accented font-bold text-lg text-content-dark">
        Інформація про клієнта
      </h3>
      
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-cream flex items-center justify-center text-[#EB6D48]">
            <Icon name="fi-rr-user" />
          </div>
          <div>
            <div className="font-semibold text-content-dark">{clientName}</div>
            <div className="text-xs text-content-dark/60">Клієнт</div>
          </div>
        </div>

        {cleanedPhone ? (
          <div className="mt-2">
            <a href={`tel:${cleanedPhone.replace(/[^\d+]/g, '')}`} className="w-full block">
              <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                <Icon name="fi-rr-phone-call" size={14} />
                Зателефонувати
              </Button>
            </a>
          </div>
        ) : !isLoadingPhone ? (
          <div className="text-xs text-content-dark/50 italic mt-1">
            Номер телефону не вказано
          </div>
        ) : null}
      </div>

      {(ticket.petName || ticket.appointmentStartsAt) && (
        <>
          <hr className="border-visit-gray/60" />
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-sm text-content-dark">Контекст звернення</h4>
            
            {ticket.petName && (
              <div className="flex items-start gap-2 text-sm text-content-dark/80">
                <Icon name="fi-rr-paw" className="mt-0.5 text-content-dark/50" size={14} />
                <div>
                  <div><span className="font-semibold">Улюбленець:</span> {ticket.petName}</div>
                  {ticket.petBreed && <div className="text-xs opacity-70">{ticket.petBreed}</div>}
                </div>
              </div>
            )}

            {ticket.appointmentStartsAt && (
              <div className="flex items-start gap-2 text-sm text-content-dark/80">
                <Icon name="fi-rr-calendar" className="mt-0.5 text-content-dark/50" size={14} />
                <div>
                  <div><span className="font-semibold">Запис:</span></div>
                  <div className="text-xs">{new Date(ticket.appointmentStartsAt).toLocaleString('uk-UA')}</div>
                  {ticket.appointmentPrice && <div className="text-xs font-semibold mt-0.5">{ticket.appointmentPrice} ₴</div>}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <hr className="border-visit-gray/60" />
      <div className="text-xs text-content-dark/50 flex items-center gap-1.5">
        <Icon name="fi-rr-clock" size={12} />
        Створено: {new Date(ticket.createdAt).toLocaleString('uk-UA')}
      </div>
    </div>
  );
};

export default CustomerContextCard;
