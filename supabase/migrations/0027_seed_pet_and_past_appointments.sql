-- Migration 0027: Seed pet 5cd6e698-19fd-4900-95d7-0a7c284c5540, pet care schedules, past appointments, and transactions

DO $$
DECLARE
  v_pet_id uuid := '5cd6e698-19fd-4900-95d7-0a7c284c5540';
  v_client_id uuid := 'b7b2777f-0414-4e4d-adda-1c6d2bf548f3';
  v_master1 uuid := '11111111-1111-1111-1111-111111111111';
  v_master2 uuid := '22222222-2222-2222-2222-222222222222';
  v_service_spa uuid := '50000000-0000-0000-0000-000000000002';
  v_service_hygiene uuid := '50000000-0000-0000-0000-000000000004';
  v_appt1 uuid := 'b0000000-0000-0000-0000-000000000021';
  v_appt2 uuid := 'b0000000-0000-0000-0000-000000000022';
  v_pay1 uuid := 'd0000000-0000-0000-0000-000000000021';
  v_pay2 uuid := 'd0000000-0000-0000-0000-000000000022';
  v_pay3 uuid := 'd0000000-0000-0000-0000-000000000023';
  v_upcoming_appt uuid := '931587af-8288-4cc5-b6aa-865cbbb28d02';
BEGIN
  -- 1. Update pet info if present
  IF EXISTS (SELECT 1 FROM public.pets WHERE id = v_pet_id) THEN
    UPDATE public.pets
    SET name = 'Міся',
        breed = 'Шотландська висловуха',
        weight_kg = 3.80,
        medical_notes = 'Алергія на курку та ароматизовані шампуні. Чутлива шкіра, використовувати виключно гіпоалергенну косметику.',
        behavior_notes = 'Боїться гучного шуму фена, потрібен спокійний підхід та сушіння на низьких обертах. Любить чухання за вушком.',
        updated_at = now()
    WHERE id = v_pet_id;

    -- 2. Care schedules
    DELETE FROM public.pet_care_schedules WHERE pet_id = v_pet_id;
    INSERT INTO public.pet_care_schedules (
      id,
      pet_id,
      category,
      title,
      drug_name,
      due_date,
      badge_text,
      valid_until_formatted,
      icon_name,
      status_text,
      status_type,
      sort_order
    ) VALUES
      (
        '80000000-0000-0000-0000-000000000005',
        v_pet_id,
        'parasites',
        'Від кліщів та бліх',
        'Bravecto Plus',
        '2026-10-25',
        '✓ Захищено',
        'Наступна: 25 жовт.',
        'fi-rr-shield-check',
        '✓ Захищено',
        'success',
        1
      ),
      (
        '80000000-0000-0000-0000-000000000006',
        v_pet_id,
        'parasites',
        'Дегельмінтизація',
        'Milbemax',
        '2026-11-15',
        'Через 1 міс.',
        'Наступна: 15 лист.',
        'fi-rr-medicine',
        'Через 1 міс.',
        'neutral',
        2
      ),
      (
        '80000000-0000-0000-0000-000000000007',
        v_pet_id,
        'vaccines',
        'Комплексна вакцинація',
        'Nobivac Tricat Trio',
        '2027-06-15',
        'Діє до 15 черв.',
        'Щорічна ревакцинація',
        'fi-rr-syringe',
        'Діє до 15 черв.',
        'success',
        3
      ),
      (
        '80000000-0000-0000-0000-000000000008',
        v_pet_id,
        'vaccines',
        'Вакцинація від сказу',
        'Nobivac Rabies',
        '2027-06-15',
        'Діє до 15 черв.',
        'Щорічна ревакцинація',
        'fi-rr-shield-check',
        'Діє до 15 черв.',
        'success',
        4
      );

    -- 3. Payments and past appointments
    INSERT INTO public.payments (
      id,
      appointment_id,
      client_id,
      amount,
      currency,
      status,
      provider,
      invoice_id,
      page_url,
      created_at,
      updated_at
    ) VALUES (
      v_pay1,
      v_appt1,
      v_client_id,
      700.00,
      'UAH',
      'successful',
      'monobank',
      'inv_mono_20260915_01',
      'https://pay.mbnk.biz/inv_mono_20260915_01',
      '2026-09-14 09:35:00+00',
      '2026-09-14 09:36:00+00'
    ) ON CONFLICT (id) DO UPDATE SET status = 'successful';

    INSERT INTO public.appointments (
      id,
      client_id,
      pet_id,
      master_id,
      service_id,
      status,
      starts_at,
      ends_at,
      price,
      client_note,
      source,
      payment_id,
      created_by,
      created_at,
      updated_at
    ) VALUES (
      v_appt1,
      v_client_id,
      v_pet_id,
      v_master1,
      v_service_spa,
      'completed',
      '2026-09-15 11:00:00+00',
      '2026-09-15 12:00:00+00',
      700.00,
      'SPA догляд та релакс',
      'web',
      v_pay1,
      v_client_id,
      '2026-09-14 09:30:00+00',
      '2026-09-15 12:05:00+00'
    ) ON CONFLICT (id) DO UPDATE SET
      status = 'completed',
      payment_id = v_pay1;

    INSERT INTO public.appointment_services (
      appointment_id,
      service_id,
      price,
      duration_min,
      sort_order
    ) VALUES (
      v_appt1,
      v_service_spa,
      700.00,
      60,
      1
    ) ON CONFLICT DO NOTHING;

    INSERT INTO public.payments (
      id,
      appointment_id,
      client_id,
      amount,
      currency,
      status,
      provider,
      invoice_id,
      page_url,
      created_at,
      updated_at
    ) VALUES (
      v_pay2,
      v_appt2,
      v_client_id,
      450.00,
      'UAH',
      'successful',
      'monobank',
      'inv_mono_20260810_01',
      'https://pay.mbnk.biz/inv_mono_20260810_01',
      '2026-08-09 12:05:00+00',
      '2026-08-09 12:06:00+00'
    ) ON CONFLICT (id) DO UPDATE SET status = 'successful';

    INSERT INTO public.appointments (
      id,
      client_id,
      pet_id,
      master_id,
      service_id,
      status,
      starts_at,
      ends_at,
      price,
      client_note,
      source,
      payment_id,
      created_by,
      created_at,
      updated_at
    ) VALUES (
      v_appt2,
      v_client_id,
      v_pet_id,
      v_master2,
      v_service_hygiene,
      'completed',
      '2026-08-10 14:00:00+00',
      '2026-08-10 14:45:00+00',
      450.00,
      'Гігієнічний догляд та підрізання кігтиків',
      'web',
      v_pay2,
      v_client_id,
      '2026-08-09 12:00:00+00',
      '2026-08-10 14:50:00+00'
    ) ON CONFLICT (id) DO UPDATE SET
      status = 'completed',
      payment_id = v_pay2;

    INSERT INTO public.appointment_services (
      appointment_id,
      service_id,
      price,
      duration_min,
      sort_order
    ) VALUES (
      v_appt2,
      v_service_hygiene,
      450.00,
      45,
      1
    ) ON CONFLICT DO NOTHING;

    -- Upcoming appointment payment and confirmation
    IF EXISTS (SELECT 1 FROM public.appointments WHERE id = v_upcoming_appt) THEN
      INSERT INTO public.payments (
        id,
        appointment_id,
        client_id,
        amount,
        currency,
        status,
        provider,
        invoice_id,
        page_url,
        created_at,
        updated_at
      ) VALUES (
        v_pay3,
        v_upcoming_appt,
        v_client_id,
        850.00,
        'UAH',
        'successful',
        'monobank',
        'inv_mono_20261005_01',
        'https://pay.mbnk.biz/inv_mono_20261005_01',
        '2026-10-05 00:39:32+00',
        '2026-10-05 00:39:35+00'
      ) ON CONFLICT (id) DO UPDATE SET status = 'successful';

      UPDATE public.appointments
      SET status = 'confirmed',
          payment_id = v_pay3,
          updated_at = now()
      WHERE id = v_upcoming_appt;
    END IF;

    -- Saved payment method
    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
      'payment_methods', jsonb_build_array(
        jsonb_build_object(
          'id', 'pm-card-1',
          'type', 'card',
          'title', '•••• 4821',
          'subtitle', 'Термін: 12/28',
          'isDefault', true,
          'last4', '4821',
          'expiry', '12/28'
        )
      )
    )
    WHERE id = v_client_id;
  END IF;
END $$;
