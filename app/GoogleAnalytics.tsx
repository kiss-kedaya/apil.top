"use client";

import React from "react";
import Script from "next/script";
import * as gtag from "../gtag.js";

const GoogleAnalytics = () => {
  if (!gtag.GA_TRACKING_ID) {
    return null;
  }

  return (
    <>
      <Script
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${gtag.GA_TRACKING_ID}`}
        defer
      />
      <Script
        id="gtag-init"
        strategy="lazyOnload"
        defer
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gtag.GA_TRACKING_ID}', {
              page_path: window.location.pathname,
              transport_type: 'beacon',
              anonymize_ip: true
            });
          `,
        }}
      />
    </>
  );
};

export default GoogleAnalytics;
