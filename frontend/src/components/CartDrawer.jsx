import { useEffect, useState } from 'react';
import { placeOrder } from '../api/api';
import { useCart } from '../context/CartContex';

function Checkmark() {
  return (
    <svg viewBox="0 0 52 52" className="h-16 w-16" fill="none" aria-hidden="true">
      <circle cx="26" cy="26" r="23" stroke="#6F4E37" strokeWidth="2" />
      <path className="animate-check-draw" d="m14 27 8 8 17-18" stroke="#6F4E37" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="44" />
    </svg>
  );
}

export default function CartDrawer() {
  const { cart, cartOpen, closeCart, updateQuantity, clearCart, total } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState('dine-in');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [locationMessage, setLocationMessage] = useState('');
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [completedOrder, setCompletedOrder] = useState(null);

  useEffect(() => {
    if (!cartOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setCheckoutOpen(false);
        closeCart();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [cartOpen, closeCart]);

  const dismiss = () => {
    setCheckoutOpen(false);
    setCompletedOrder(null);
    setError('');
    setLocationMessage('');
    closeCart();
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage('Location sharing is not available in this browser.');
      return;
    }

    setLocating(true);
    setLocationMessage('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setDeliveryLocation({ latitude: coords.latitude, longitude: coords.longitude });
        setLocationMessage('Location added. Your written address is still required.');
        setLocating(false);
      },
      () => {
        setLocationMessage('We could not access your location. You can still enter your address.');
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    if (!customerName.trim()) {
      setError('Please enter your name.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const order = await placeOrder({
        customerName: customerName.trim(),
        fulfillmentType,
        ...(fulfillmentType === 'delivery' ? {
          deliveryPhone: deliveryPhone.trim(),
          deliveryAddress: deliveryAddress.trim(),
          ...(deliveryLocation ? { deliveryLocation } : {})
        } : {}),
        items: cart.map(({ id, quantity }) => ({ id, quantity }))
      });
      setCompletedOrder(order);
      setCheckoutOpen(false);
      setCustomerName('');
      setDeliveryPhone('');
      setDeliveryAddress('');
      setDeliveryLocation(null);
      setLocationMessage('');
      clearCart();
    } catch (requestError) {
      setError(requestError.message || 'We could not submit your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px] transition-opacity duration-300 ${cartOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`} aria-hidden={!cartOpen}>
        <button className="absolute inset-0 h-full w-full cursor-default bg-transparent" onClick={dismiss} aria-label="Close cart drawer" tabIndex={cartOpen ? 0 : -1} />
      </div>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Your order"
        aria-hidden={!cartOpen}
        className={`fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-[500px] flex-col border-l border-ember-line bg-ember-panel text-ember-ivory shadow-ember transition-transform duration-300 ease-out ${cartOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-ember-line px-6 py-5 sm:px-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.25em] text-ember-copper">Brew &amp; Bloom</p>
            <h2 className="mt-1 font-display text-2xl">Your order <span className="text-base text-ember-muted">({cart.reduce((sum, item) => sum + item.quantity, 0)})</span></h2>
          </div>
          <button type="button" onClick={dismiss} className="grid h-10 w-10 place-items-center rounded-full border border-ember-line text-xl text-ember-muted transition hover:rotate-90 hover:border-ember-copper hover:text-ember-ivory" aria-label="Close cart">×</button>
        </div>

        {completedOrder ? (
          <div className="flex flex-1 flex-col items-center justify-center px-7 text-center">
            <div className="grid h-28 w-28 animate-soft-pulse place-items-center rounded-full border border-ember-copper/30"><Checkmark /></div>
            <p className="mt-8 text-xs font-bold uppercase tracking-[.25em] text-ember-copper">Order received</p>
            <h3 className="mt-3 font-display text-3xl">The good part starts now.</h3>
            <p className="mt-3 text-sm text-ember-muted">{completedOrder.fulfillmentType === 'delivery' ? 'Your delivery order is being prepared.' : `We’re preparing your order for table ${completedOrder.tableNumber}.`}</p>
            <p className="mt-9 text-[10px] font-bold uppercase tracking-[.26em] text-ember-gold">Your order number</p>
            <p className="mt-2 font-display text-4xl font-bold tracking-wider text-ember-copper sm:text-5xl">{completedOrder.orderNumber}</p>
            <p className="mt-4 text-sm text-ember-muted">{completedOrder.fulfillmentType === 'delivery' ? `Delivery address: ${completedOrder.deliveryAddress}` : `Keep this number close. We’ll bring your order to table ${completedOrder.tableNumber}.`}</p>
            <button type="button" onClick={dismiss} className="mt-10 rounded-full bg-ember-copper px-7 py-3.5 text-sm font-bold text-ember-charcoal transition hover:scale-105 hover:bg-ember-gold">Back to the menu</button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-8">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="text-5xl text-ember-gold/70">∅</span>
                  <h3 className="mt-5 font-display text-2xl">Your cup is empty.</h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-ember-muted">Find a roast or a little something sweet to get started.</p>
                  <a href="/#menu" onClick={dismiss} className="mt-7 rounded-full border border-ember-copper px-5 py-3 text-sm font-semibold text-ember-copper transition hover:bg-ember-copper hover:text-ember-charcoal">Explore the menu</a>
                </div>
              ) : (
                <ul className="divide-y divide-ember-line">
                  {cart.map((item) => (
                    <li key={item.id} className="flex gap-4 py-5">
                      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-ember-line bg-gradient-to-br from-ember-raised to-[#4a3428] text-2xl text-ember-gold">☕</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="truncate font-display text-lg">{item.name}</h3>
                            <p className="mt-1 text-xs text-ember-muted">R{Number(item.price).toFixed(2)} each</p>
                          </div>
                          <span className="whitespace-nowrap text-sm font-semibold text-ember-gold">R{(Number(item.price) * item.quantity).toFixed(2)}</span>
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex items-center rounded-full border border-ember-line">
                            <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-8 w-8 bg-transparent p-0 text-ember-ivory transition hover:text-ember-copper" aria-label={`Decrease ${item.name} quantity`}>−</button>
                            <span className="w-6 text-center text-xs">{item.quantity}</span>
                            <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-8 w-8 bg-transparent p-0 text-ember-ivory transition hover:text-ember-copper" aria-label={`Increase ${item.name} quantity`}>+</button>
                          </div>
                          <button type="button" onClick={() => updateQuantity(item.id, 0)} className="bg-transparent p-1 text-xs text-ember-muted underline decoration-ember-line underline-offset-4 transition hover:text-red-300">Remove</button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-ember-line bg-ember-charcoal/60 px-6 py-6 sm:px-8">
                <div className="mb-2 flex justify-between text-sm text-ember-muted"><span>Subtotal</span><span>R{total.toFixed(2)}</span></div>
                <div className="mb-5 flex justify-between font-display text-xl"><span>Total</span><span className="text-ember-gold">R{total.toFixed(2)}</span></div>
                <button type="button" onClick={() => { setError(''); setCheckoutOpen(true); }} className="flex w-full items-center justify-center gap-3 rounded-full bg-ember-copper py-4 text-sm font-bold text-ember-charcoal transition hover:scale-[1.02] hover:bg-ember-gold">
                  Continue to checkout <span aria-hidden="true">→</span>
                </button>
                <p className="mt-3 text-center text-[10px] text-ember-muted">Your order is sent directly to our barista.</p>
              </div>
            )}
          </>
        )}
      </aside>

      {checkoutOpen && (
        <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCheckoutOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="checkout-title" className="my-auto w-full max-w-md rounded-3xl border border-ember-line bg-ember-panel p-6 text-ember-ivory shadow-ember sm:p-9">
            <p className="text-[10px] font-bold uppercase tracking-[.25em] text-ember-copper">Almost yours</p>
            <h2 id="checkout-title" className="mt-2 font-display text-3xl">Where should we bring it?</h2>
            <p className="mt-3 text-sm leading-6 text-ember-muted">Choose how you&apos;d like to receive your order.</p>
            {error && <p role="alert" className="mt-5 rounded-xl border border-red-900 bg-red-950/30 p-3 text-sm text-red-200">{error}</p>}
            <form onSubmit={submitOrder} className="mt-6">
              <fieldset>
                <legend className="mb-2 block text-xs font-semibold text-ember-gold">Order type</legend>
                <div className="grid grid-cols-2 rounded-xl border border-ember-line bg-ember-charcoal p-1">
                  {[
                    { value: 'dine-in', label: 'Dine in' },
                    { value: 'delivery', label: 'Delivery' }
                  ].map((option) => (
                    <button key={option.value} type="button" aria-pressed={fulfillmentType === option.value} onClick={() => { setFulfillmentType(option.value); setError(''); }} className={`rounded-lg px-3 py-3 text-sm font-semibold transition ${fulfillmentType === option.value ? 'bg-ember-copper text-ember-charcoal' : 'bg-transparent text-ember-muted hover:text-ember-ivory'}`}>{option.label}</button>
                  ))}
                </div>
              </fieldset>
              <label htmlFor="checkout-name" className="mb-2 block text-xs font-semibold text-ember-gold">Your name</label>
              <input id="checkout-name" autoFocus required maxLength={80} value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="How should we call you?" className="mt-2 w-full rounded-xl border border-ember-line bg-ember-charcoal px-4 py-3.5 text-sm text-ember-ivory outline-none transition placeholder:text-ember-muted/60 focus:border-ember-copper focus:ring-2 focus:ring-ember-copper/20" />
              {fulfillmentType === 'delivery' ? (
                <div className="mt-5 space-y-4">
                  <label htmlFor="delivery-phone" className="block text-xs font-semibold text-ember-gold">Phone number
                    <input id="delivery-phone" type="tel" autoComplete="tel" required minLength={7} maxLength={30} value={deliveryPhone} onChange={(event) => setDeliveryPhone(event.target.value)} placeholder="A number the driver can call" className="mt-2 w-full rounded-xl border border-ember-line bg-ember-charcoal px-4 py-3.5 text-sm text-ember-ivory outline-none transition placeholder:text-ember-muted/60 focus:border-ember-copper focus:ring-2 focus:ring-ember-copper/20" />
                  </label>
                  <label htmlFor="delivery-address" className="block text-xs font-semibold text-ember-gold">Delivery address
                    <textarea id="delivery-address" required maxLength={300} rows="3" value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} placeholder="Street, area, house or apartment number" className="mt-2 w-full resize-y rounded-xl border border-ember-line bg-ember-charcoal px-4 py-3.5 text-sm text-ember-ivory outline-none transition placeholder:text-ember-muted/60 focus:border-ember-copper focus:ring-2 focus:ring-ember-copper/20" />
                  </label>
                  <div>
                    <button type="button" disabled={locating} onClick={useCurrentLocation} className="rounded-full border border-ember-line px-4 py-2.5 text-xs font-semibold text-ember-ivory transition hover:border-ember-gold disabled:opacity-50">{locating ? 'Getting location…' : deliveryLocation ? 'Location added ✓' : 'Share current location (optional)'}</button>
                    {locationMessage && <p role="status" className="mt-2 text-xs text-ember-muted">{locationMessage}</p>}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs text-ember-muted">We&apos;ll assign you a free table.</p>
              )}
              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setCheckoutOpen(false)} disabled={submitting} className="flex-1 rounded-full border border-ember-line bg-transparent py-3.5 text-sm font-semibold text-ember-ivory transition hover:border-ember-gold">Back</button>
                <button type="submit" disabled={submitting} className="flex-1 rounded-full bg-ember-copper py-3.5 text-sm font-bold text-ember-charcoal transition hover:scale-[1.02] hover:bg-ember-gold disabled:cursor-wait disabled:opacity-60">{submitting ? 'Sending…' : `Place order · R${total.toFixed(2)}`}</button>
              </div>
            </form>
            <p className="mt-5 text-center text-[10px] text-ember-muted">Placing an order means our team can start preparing it straight away.</p>
          </section>
        </div>
      )}
    </>
  );
}
