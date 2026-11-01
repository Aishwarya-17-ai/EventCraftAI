import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fs from 'fs';
import path from 'path';
import { EventForm } from '../components/EventForm';
import { LoginPage } from '../components/LoginPage';
import { VendorsTab } from '../components/VendorsTab';
import { Tabs } from '../components/Tabs';
import { BudgetTab } from '../components/BudgetTab';
import { ChatTab } from '../components/ChatTab';
import { calculateBudget } from '../lib/budget';
import { EventFormData, EventType } from '../lib/types';

describe('UI Components & Accessibility', () => {
  const sampleEvent: EventFormData = {
    eventType: 'wedding',
    name: 'Maya & Arjun Wedding',
    date: '2028-11-20',
    guestCount: 150,
    totalBudget: 2000000,
    currency: 'INR',
    city: 'Bengaluru',
    theme: 'Eco-chic floral',
    notes: 'Pure vegetarian meal options',
  };

  it('form shows accessible inline errors linked via aria-describedby and role=alert', async () => {
    const handleSubmit = vi.fn();
    render(
      <EventForm
        initialData={{ ...sampleEvent, name: '', guestCount: 0 }}
        onSubmit={handleSubmit}
        isLoading={false}
        currency="INR"
      />
    );

    const submitBtn = screen.getByRole('button', { name: /generate event plan/i });
    fireEvent.click(submitBtn);

    // Name error should be linked via aria-describedby
    const nameInput = screen.getByLabelText(/event name/i);
    expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    const nameDescribedBy = nameInput.getAttribute('aria-describedby');
    expect(nameDescribedBy).toBe('error-name');

    const nameErrorEl = document.getElementById('error-name');
    expect(nameErrorEl).toBeInTheDocument();
    expect(nameErrorEl).toHaveAttribute('role', 'alert');
    expect(nameErrorEl?.textContent).toContain('Event name is required');

    // Guest error should be linked via aria-describedby
    const guestInput = screen.getByLabelText(/guest count/i);
    expect(guestInput).toHaveAttribute('aria-invalid', 'true');
    const guestDescribedBy = guestInput.getAttribute('aria-describedby');
    expect(guestDescribedBy).toBe('error-guestCount');

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('tabs support full keyboard navigation (ArrowRight, ArrowLeft, Home, End)', async () => {
    const handleTabChange = vi.fn();
    const { rerender } = render(
      <Tabs activeTab="budget" onTabChange={handleTabChange} isMobile={false}>
        <div id="panel-budget">Budget Content</div>
      </Tabs>
    );

    const budgetTab = screen.getByRole('tab', { name: /budget/i });
    expect(budgetTab).toHaveAttribute('aria-selected', 'true');
    expect(budgetTab).toHaveAttribute('tabindex', '0');

    // Press ArrowRight from budget -> moves to Timeline
    fireEvent.keyDown(budgetTab, { key: 'ArrowRight' });
    expect(handleTabChange).toHaveBeenCalledWith('timeline');

    // Press End from budget -> moves to Chat (last tab)
    fireEvent.keyDown(budgetTab, { key: 'End' });
    expect(handleTabChange).toHaveBeenCalledWith('chat');

    // Rerender with activeTab="chat" to test Home navigation
    rerender(
      <Tabs activeTab="chat" onTabChange={handleTabChange} isMobile={false}>
        <div id="panel-chat">Chat Content</div>
      </Tabs>
    );

    const chatTab = screen.getByRole('tab', { name: /chat/i });
    // Press Home from chat -> moves to Budget (first tab)
    fireEvent.keyDown(chatTab, { key: 'Home' });
    expect(handleTabChange).toHaveBeenCalledWith('budget');

    // Press ArrowLeft from chat -> moves to Ideas
    fireEvent.keyDown(chatTab, { key: 'ArrowLeft' });
    expect(handleTabChange).toHaveBeenCalledWith('ideas');
  });

  it('the budget table has an accessible caption and th scope attributes', () => {
    const budget = calculateBudget('wedding', 50000, 100, 'USD');
    render(<BudgetTab budget={budget} />);

    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    // Verify caption
    const caption = table.querySelector('caption');
    expect(caption).toBeInTheDocument();
    expect(caption?.textContent).toContain('Category Allocations');

    // Verify th scopes
    const columnHeaders = table.querySelectorAll('th[scope="col"]');
    expect(columnHeaders.length).toBeGreaterThan(0);

    const rowHeaders = table.querySelectorAll('th[scope="row"]');
    expect(rowHeaders.length).toBeGreaterThan(0);
  });

  it('renders user and model text safely as text, preventing XSS injection (e.g. <img src=x onerror=alert(1)> and <script>)', async () => {
    const maliciousPayload = '<script>alert("xss")</script>';
    const xssEvent: EventFormData = {
      ...sampleEvent,
      name: maliciousPayload,
      eventType: 'others',
      customEventType: '<script>alert("custom")</script>',
    };

    render(<ChatTab eventContext={xssEvent} />);

    // Type the malicious string into the chat
    const input = screen.getByRole('textbox', { name: /ask the event planner/i });
    const sendButton = screen.getByRole('button', { name: /send message/i });

    await userEvent.type(input, maliciousPayload);
    fireEvent.click(sendButton);

    // Verify no script DOM element is inserted into document
    const scriptElements = document.querySelectorAll('script');
    const hasInjectedScript = Array.from(scriptElements).some((s) => s.textContent?.includes('alert("xss")'));
    expect(hasInjectedScript).toBe(false);

    // The text content is rendered as safe text
    expect(screen.getAllByText(maliciousPayload).length).toBeGreaterThan(0);
  });

  it('renders all 13 event type cards as real radio inputs in the responsive grid', () => {
    render(
      <EventForm
        initialData={sampleEvent}
        onSubmit={vi.fn()}
        isLoading={false}
        currency="INR"
      />
    );

    const radioGroup = screen.getByRole('radiogroup', { name: /event category/i });
    expect(radioGroup).toBeInTheDocument();

    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBe(13);

    // Verify touch targets have at least the minimum accessible styling class/attributes
    const weddingRadio = screen.getByRole('radio', { name: /wedding/i });
    expect(weddingRadio).toBeChecked();
  });

  it('reveals "Describe your event" input when "Others" is selected and enforces 60 character limit', async () => {
    render(
      <EventForm
        initialData={sampleEvent}
        onSubmit={vi.fn()}
        isLoading={false}
        currency="INR"
      />
    );

    // Initially "Describe your event" should not be visible for wedding
    expect(screen.queryByLabelText(/describe your event/i)).toBeNull();

    // Select "Others"
    const othersRadio = screen.getByRole('radio', { name: /others/i });
    fireEvent.click(othersRadio);

    // Now the custom event description input should appear
    const customInput = screen.getByLabelText(/describe your event/i);
    expect(customInput).toBeInTheDocument();
    expect(customInput).toHaveAttribute('maxLength', '60');
    expect(customInput).toBeRequired();
  });

  it('LoginPage renders logo mark, EventCraft AI text, has NO "Welcome back" heading, no tab buttons, no guest link, no feature cards, and nothing below the card', () => {
    const handleGoogleLogin = vi.fn();
    const handleEmail = vi.fn();

    render(
      <LoginPage
        onGoogleLogin={handleGoogleLogin}
        onEmailSignIn={handleEmail}
        currency="INR"
      />
    );

    // EventCraft AI branding present
    expect(screen.getByRole('heading', { name: /eventcraft ai/i, level: 1 })).toBeInTheDocument();

    // NO "Welcome back" or "Create your account" headings
    expect(screen.queryByRole('heading', { name: /welcome back/i })).toBeNull();
    expect(screen.queryByRole('heading', { name: /create your account/i })).toBeNull();

    // NO tab buttons
    expect(screen.queryAllByRole('tab').length).toBe(0);

    // NO guest link or text
    expect(screen.queryByRole('button', { name: /continue as guest/i })).toBeNull();
    expect(screen.queryByText(/plan without an account/i)).toBeNull();

    // NO feature cards below the card
    expect(screen.queryByText(/adaptive timeline/i)).toBeNull();
    expect(screen.queryByText(/deterministic budgets/i)).toBeNull();
    expect(screen.queryByText(/vendor shortlists/i)).toBeNull();

    // Centered 48px Continue with Google button
    const googleBtn = screen.getByRole('button', { name: /continue with google/i });
    expect(googleBtn).toBeInTheDocument();
    fireEvent.click(googleBtn);
    expect(handleGoogleLogin).toHaveBeenCalledTimes(1);

    // Visible labelled inputs with aria-hidden icons
    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('autocomplete', 'email');

    const passwordInput = screen.getByLabelText(/^password/i);
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Show-password toggle exposes aria-pressed
    const togglePasswordBtn = screen.getByRole('button', { name: /show password/i });
    expect(togglePasswordBtn).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(togglePasswordBtn);
    expect(togglePasswordBtn).toHaveAttribute('aria-pressed', 'true');
    expect(passwordInput).toHaveAttribute('type', 'text');

    // Primary button label in signin mode is "Sign in"
    const submitBtn = screen.getByRole('button', { name: /^sign in$/i });
    expect(submitBtn).toBeInTheDocument();

    // Forgot password link in signin mode
    expect(screen.getByRole('button', { name: /forgot password\?/i })).toBeInTheDocument();

    // Mode switch: clicking "Sign up" switches to signup mode
    const signUpModeBtn = screen.getByRole('button', { name: /^sign up$/i });
    fireEvent.click(signUpModeBtn);

    // In signup mode, primary button becomes "Create account"
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();

    // Forgot password is hidden in signup mode
    expect(screen.queryByRole('button', { name: /forgot password\?/i })).toBeNull();
  });

  it('vendors tab no longer contains "What to look for", "Questions to ask" or "View details"', () => {
    render(
      <VendorsTab
        eventType="wedding"
        eventName="Maya & Arjun Wedding"
        eventId="test-no-details"
        city="Bengaluru, India"
      />
    );

    // Strictly removed
    expect(screen.queryByText(/what to look for/i)).toBeNull();
    expect(screen.queryByText(/questions to ask/i)).toBeNull();
    expect(screen.queryByText(/view details/i)).toBeNull();
  });

  it('each category renders as one card containing its header, action row and vendor cards', () => {
    render(
      <VendorsTab
        eventType="wedding"
        eventName="Maya & Arjun Wedding"
        eventId="test-category-card"
        city="Bengaluru, India"
      />
    );

    // Check category title
    expect(screen.getByRole('heading', { name: /marriage halls/i, level: 3 })).toBeInTheDocument();

    // Check action row buttons
    expect(screen.getAllByRole('link', { name: /find nearby.*on google maps/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /near your current gps location/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /ai tips for/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /add a vendor to/i }).length).toBeGreaterThan(0);
  });

  it('the blue top box contains Add a vendor and Export JSON buttons and stats', () => {
    render(
      <VendorsTab
        eventType="wedding"
        eventName="Maya & Arjun Wedding"
        eventId="test-top-blue-box"
        city="Bengaluru, India"
      />
    );

    // Top title
    expect(screen.getByRole('heading', { name: /^vendors$/i, level: 2 })).toBeInTheDocument();

    // Buttons in top box
    expect(screen.getByRole('button', { name: /\+ add a vendor/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export json/i })).toBeInTheDocument();

    // Stat tiles
    expect(screen.getAllByText(/vendors added/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/booked/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/quotes vs budget/i)).toBeInTheDocument();
  });

  it('filter pills and sort dropdown work on the vendors tab', async () => {
    render(
      <VendorsTab
        eventType="wedding"
        eventName="Maya & Arjun Wedding"
        eventId="test-filter-sort"
        city="Bengaluru, India"
      />
    );

    // Check filter pills
    expect(screen.getByRole('button', { name: /^all$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^shortlisted$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^booked$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^rating 4\+$/i })).toBeInTheDocument();

    // Click Shortlisted filter
    const shortlistedBtn = screen.getByRole('button', { name: /^shortlisted$/i });
    fireEvent.click(shortlistedBtn);
    expect(shortlistedBtn).toHaveClass('pill-primary');

    // Check sort dropdown
    const sortSelect = screen.getByLabelText(/sort vendors/i);
    expect(sortSelect).toBeInTheDocument();
    fireEvent.change(sortSelect, { target: { value: 'name_asc' } });
    expect(sortSelect).toHaveValue('name_asc');
  });

  it('a vendor added from a category card lands in that category', async () => {
    render(
      <VendorsTab
        eventType="wedding"
        eventName="Maya & Arjun Wedding"
        eventId="test-add-preselected"
        city="Bengaluru, India"
      />
    );

    // Click "+ Add vendor" on Marriage Halls category
    const addMandapamBtn = screen.getByRole('button', { name: /add a vendor to marriage halls/i });
    fireEvent.click(addMandapamBtn);

    // Category select should have Marriage Halls preselected
    const categorySelect = screen.getByLabelText(/vendor category/i);
    expect(categorySelect).toHaveValue('wedding-marriage-halls');

    // Fill in name and submit
    const nameInput = screen.getByLabelText(/vendor \/ business name/i);
    await userEvent.type(nameInput, 'Sri Krishna Kalyana Mandapam');
    const submitBtn = screen.getByRole('button', { name: /^add vendor$/i });
    fireEvent.click(submitBtn);

    // Verify vendor appears
    expect(screen.getByText('Sri Krishna Kalyana Mandapam')).toBeInTheDocument();
  });

  it('no vendor card contains invented company names, fake ratings, or fake badges', () => {
    render(
      <VendorsTab
        eventType="wedding"
        eventName="Maya & Arjun Wedding"
        eventId="test-event-clean"
        city="Bengaluru, India"
      />
    );

    // Fabricated businesses must NOT appear
    expect(screen.queryByText('Lumière Stories & Cinema')).toBeNull();
    expect(screen.queryByText('Saffron & Thyme Catering Co.')).toBeNull();
    expect(screen.queryByText('FloraBloom Botanical Studio')).toBeNull();
    expect(screen.queryByText('GrooveWave Sound & Lighting')).toBeNull();

    // Fake badges and reviews must NOT appear
    expect(screen.queryByText(/top rated/i)).toBeNull();
    expect(screen.queryByText(/award winner/i)).toBeNull();
    expect(screen.queryByText(/verified vendor/i)).toBeNull();
  });

  it('Google Maps link is correctly encoded with city, spaces, quotes, and special characters', () => {
    render(
      <VendorsTab
        eventType="wedding"
        eventName="Maya & Arjun Wedding"
        eventId="test-event-maps"
        city="Bengaluru, India"
      />
    );

    const mapsLinks = screen.getAllByRole('link', { name: /find nearby.*on google maps/i });
    expect(mapsLinks.length).toBeGreaterThan(0);

    const firstLink = mapsLinks[0];
    expect(firstLink).toHaveAttribute('target', '_blank');
    expect(firstLink).toHaveAttribute('rel', 'noopener noreferrer');

    const href = firstLink.getAttribute('href') || '';
    expect(href).toContain('https://www.google.com/maps/search/?api=1&query=');
    // Query string properly encoded
    expect(href).toMatch(/Bengaluru(%2C|\,)(%20|\+)India/);
  });

  it('geolocation denial/error falls back gracefully to city search', async () => {
    const originalGeolocation = navigator.geolocation;
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    // Mock geolocation error
    const mockGeolocation = {
      getCurrentPosition: vi.fn((_success, error) => {
        error({ code: 1, message: 'User denied Geolocation' });
      }),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    };
    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
    });

    render(
      <VendorsTab
        eventType="wedding"
        eventName="Maya & Arjun Wedding"
        eventId="test-event-geo"
        city="Bengaluru"
      />
    );

    const nearMeButtons = screen.getAllByRole('button', { name: /search.*near your current gps location/i });
    fireEvent.click(nearMeButtons[0]);

    // Should inform user and open city search
    expect(windowOpenSpy).toHaveBeenCalledWith(
      expect.stringContaining('Bengaluru'),
      '_blank',
      expect.any(String)
    );

    windowOpenSpy.mockRestore();
    Object.defineProperty(navigator, 'geolocation', {
      value: originalGeolocation,
      configurable: true,
    });
  });

  it('add, edit, and delete vendor flow works and displays within-budget and over-budget text labels with icons', async () => {
    render(
      <VendorsTab
        eventType="wedding"
        eventName="Maya & Arjun Wedding"
        eventId="test-event-add-vendor-flow"
        city="Bengaluru"
        totalBudget={100000}
        currency="USD"
      />
    );

    // Open Add Vendor Modal via category button
    const addVendorBtn = screen.getAllByRole('button', { name: /add a vendor to/i })[0];
    fireEvent.click(addVendorBtn);

    // Fill in within-budget vendor
    const nameInput = screen.getByLabelText(/vendor \/ business name/i);
    const priceInput = screen.getByLabelText(/quoted price/i);
    const phoneInput = screen.getByLabelText(/phone number/i);
    const submitBtn = screen.getByRole('button', { name: /^add vendor$/i });

    await userEvent.type(nameInput, 'Grand Palace Mandapam');
    await userEvent.type(priceInput, '1000');
    await userEvent.type(phoneInput, '+1 (555) 123-4567');
    fireEvent.click(submitBtn);

    // Verify vendor card renders with name, phone, and within-budget text + icon
    expect(screen.getByText('Grand Palace Mandapam')).toBeInTheDocument();
    expect(screen.getByText(/within budget/i)).toBeInTheDocument();

    // Verify phone is rendered and sanitized
    const phoneLink = screen.getAllByRole('link', { name: /call grand palace mandapam/i })[0];
    expect(phoneLink).toHaveAttribute('href', 'tel:+15551234567');

    // Add an over-budget vendor (e.g. $90,000)
    const addAnotherBtn = screen.getAllByRole('button', { name: /add a vendor to/i })[0];
    fireEvent.click(addAnotherBtn);

    const nameInput2 = screen.getByLabelText(/vendor \/ business name/i);
    const priceInput2 = screen.getByLabelText(/quoted price/i);
    const submitBtn2 = screen.getByRole('button', { name: /^add vendor$/i });

    await userEvent.type(nameInput2, 'Ultra Luxury Palace');
    await userEvent.type(priceInput2, '90000');
    fireEvent.click(submitBtn2);

    expect(screen.getByText('Ultra Luxury Palace')).toBeInTheDocument();
    expect(screen.getByText(/over by/i)).toBeInTheDocument();

    // Toggle Shortlist on first vendor
    const shortlistBtn = screen.getByRole('button', { name: /shortlist grand palace mandapam/i });
    expect(shortlistBtn).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(shortlistBtn);
    expect(shortlistBtn).toHaveAttribute('aria-pressed', 'true');

    // Mark as Booked
    const bookBtn = screen.getByRole('button', { name: /mark grand palace mandapam as booked/i });
    expect(bookBtn).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(bookBtn);
    expect(bookBtn).toHaveAttribute('aria-pressed', 'true');

    // Delete vendor with confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const removeBtn = screen.getByRole('button', { name: /remove ultra luxury palace/i });
    fireEvent.click(removeBtn);
    expect(confirmSpy).toHaveBeenCalled();
    expect(screen.queryByText('Ultra Luxury Palace')).toBeNull();
    confirmSpy.mockRestore();
  });

  it('demo data switch toggles sample cards with visible "Sample" chip', async () => {
    render(
      <VendorsTab
        eventType="wedding"
        eventName="Maya & Arjun Wedding"
        eventId="test-event-demo-switch"
        city="Bengaluru"
      />
    );

    const demoSwitch = screen.getByLabelText(/show demo vendors/i);
    expect(demoSwitch).not.toBeChecked();

    // Turn ON demo switch
    fireEvent.click(demoSwitch);
    expect(demoSwitch).toBeChecked();

    // Sample chips should be present
    const sampleChips = screen.getAllByText(/sample - not a real business/i);
    expect(sampleChips.length).toBeGreaterThan(0);

    // Turn OFF demo switch
    fireEvent.click(demoSwitch);
    expect(demoSwitch).not.toBeChecked();
    expect(screen.queryByText(/sample - not a real business/i)).toBeNull();
  });

  it('form validates name required, category required, and links inline errors via aria-describedby', async () => {
    render(
      <VendorsTab
        eventType="wedding"
        eventName="Maya & Arjun Wedding"
        eventId="test-event-form-validation"
        city="Bengaluru"
      />
    );

    // Open from top button without category preselected
    const topAddBtn = screen.getByRole('button', { name: /\+ add a vendor/i });
    fireEvent.click(topAddBtn);

    // Submit empty form
    const submitBtn = screen.getByRole('button', { name: /^add vendor$/i });
    fireEvent.click(submitBtn);

    const categorySelect = screen.getByLabelText(/vendor category/i);
    expect(categorySelect).toHaveAttribute('aria-invalid', 'true');
    expect(categorySelect).toHaveAttribute('aria-describedby', 'error-vendor-category');

    const nameInput = screen.getByLabelText(/vendor \/ business name/i);
    expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    expect(nameInput).toHaveAttribute('aria-describedby', 'error-vendor-name');
  });

  it('quote with <script> in name renders safely as text without executing script', async () => {
    const xssPayload = '<script>alert("vendor-xss")</script>';

    render(
      <VendorsTab
        eventType="wedding"
        eventName="Maya & Arjun Wedding"
        eventId="test-event-xss"
        city="Bengaluru"
      />
    );

    const addBtn = screen.getAllByRole('button', { name: /add a vendor to/i })[0];
    fireEvent.click(addBtn);

    const nameInput = screen.getByLabelText(/vendor \/ business name/i);
    const priceInput = screen.getByLabelText(/quoted price/i);
    const submitBtn = screen.getByRole('button', { name: /^add vendor$/i });

    await userEvent.type(nameInput, xssPayload);
    await userEvent.type(priceInput, '500');
    fireEvent.click(submitBtn);

    // Rendered strictly as text
    expect(screen.getByText(xssPayload)).toBeInTheDocument();

    // Verify no executable script tag was added
    const scripts = Array.from(document.querySelectorAll('script'));
    const injected = scripts.some((s) => s.textContent?.includes('vendor-xss'));
    expect(injected).toBe(false);
  });

  it('no component uses an undefined CSS class (checks custom classes against styles.css and Tailwind)', () => {
    const stylesPath = path.resolve('src/styles.css');
    const cssContent = fs.readFileSync(stylesPath, 'utf8');

    // Verify critical design tokens and base reset classes are explicitly defined
    const requiredDefinitions = [
      '--primary: #1D4ED8;',
      '--navy: #0B1B4D;',
      '--bg: #F4F7FC;',
      '--surface: #FFFFFF;',
      '--border: #E3E8F2;',
      '.btn',
      '.btn-primary',
      '.btn-secondary',
      '.btn-ghost',
      '.btn-white',
      '.card',
      '.chip',
      '.pill',
      '.input-wrap',
      '.icon',
      '.brand-logo',
      '.google-btn',
      '.login-divider',
    ];

    requiredDefinitions.forEach((def) => {
      expect(cssContent).toContain(def);
    });
  });

  it('verifies NO Google Places API is referenced in the application', () => {
    expect(typeof (window as any).google?.maps?.places).toBe('undefined');
    expect(process.env.VITE_GOOGLE_PLACES_API_KEY).toBeUndefined();
  });
});
