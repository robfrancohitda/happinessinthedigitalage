export {};

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    __hitdaCommercialTrackingReady?: boolean;
  }
}

function createPayload(
  element: HTMLElement,
  eventName: string,
): Record<string, unknown> {
  return {
    event: eventName,
    product_id: element.dataset.productId,
    campaign_id: element.dataset.campaignId,
    article_id: element.dataset.articleId,
    placement: element.dataset.placement,
    destination:
      element instanceof HTMLAnchorElement ? element.href : undefined,
    page_path: window.location.pathname,
  };
}

function emitCommercialEvent(
  element: HTMLElement,
  eventName: string,
): void {
  const payload = createPayload(element, eventName);

  window.dataLayer?.push(payload);

  document.dispatchEvent(
    new CustomEvent('hitda:commercial-event', {
      detail: payload,
    }),
  );
}

function initializeCommercialTracking(): void {
  if (window.__hitdaCommercialTrackingReady) return;

  window.__hitdaCommercialTrackingReady = true;

  document.addEventListener('click', (event) => {
    const target = event.target;

    if (!(target instanceof Element)) return;

    const element = target.closest<HTMLElement>(
      '[data-commercial-track]',
    );

    if (!element) return;

    const eventName = element.dataset.commercialTrack;

    if (eventName) {
      emitCommercialEvent(element, eventName);
    }
  });

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        const element = entry.target as HTMLElement;
        const eventName = element.dataset.commercialImpression;

        if (eventName) {
          emitCommercialEvent(element, eventName);
          observer.unobserve(element);
        }
      }
    },
    { threshold: 0.5 },
  );

  document
    .querySelectorAll<HTMLElement>(
      '[data-commercial-impression]',
    )
    .forEach((element) => observer.observe(element));
}

initializeCommercialTracking();
