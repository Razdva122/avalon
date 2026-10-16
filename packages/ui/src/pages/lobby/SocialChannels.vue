<template>
  <section class="social-card" :aria-label="$t('mainPage.socialTitle')">
    <div class="social-card__copy">
      <h2>{{ $t('mainPage.socialTitle') }}</h2>
      <p>{{ $t('mainPage.socialDescription') }}</p>
    </div>
    <nav :aria-label="$t('mainPage.socialTitle')">
      <a href="https://www.youtube.com/@playavalononline" target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 576 512" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"
          />
        </svg>
        <span>YouTube</span>
      </a>
      <a href="https://www.instagram.com/playavalononline/" target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 448 512" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"
          />
        </svg>
        <span>Instagram</span>
      </a>
    </nav>
  </section>
</template>

<style scoped lang="scss">
.social-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 20px;
  padding: 20px;
  min-width: 0;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.12);
  border-radius: 14px;
  background: rgb(var(--v-theme-inset));
  color: rgb(var(--v-theme-text-primary));
  h2 {
    font-size: 18px;
    line-height: 1.3;
    text-wrap: balance;
  }
  p {
    margin-top: 6px;
    font-size: 14px;
    line-height: 1.5;
    color: rgba(var(--v-theme-text-primary), 0.75);
  }
  nav {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
  a {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-width: 140px;
    min-height: 44px;
    padding: 10px 12px;
    border: 1px solid rgba(var(--v-theme-text-primary), 0.18);
    border-radius: 8px;
    color: inherit;
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
  }
  a:hover {
    background: rgba(var(--v-theme-primary), 0.12);
    border-color: rgb(var(--v-theme-primary));
  }
  a:focus-visible {
    outline: 2px solid rgb(var(--v-theme-text-primary));
    outline-offset: 3px;
  }
  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
}
@media (max-width: 760px) {
  .social-card {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
    padding: 16px;
    a {
      min-width: 0;
      padding-inline: 8px;
    }
  }
}
</style>
