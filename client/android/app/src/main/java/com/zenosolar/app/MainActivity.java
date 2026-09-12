package com.zenosolar.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            // Force clear WebView cache and disable caching of bundled assets so updates apply instantly
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();
                webView.clearCache(true);
                WebSettings settings = webView.getSettings();
                if (settings != null) {
                    settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        try {
            Window window = getWindow();

            // Set dark background for status bar & navigation bar
            window.setStatusBarColor(Color.parseColor("#0d1117"));
            window.setNavigationBarColor(Color.parseColor("#0d1117"));

            // Ensure window handles system bars explicitly
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);

            // Tell window we handle insets explicitly
            WindowCompat.setDecorFitsSystemWindows(window, false);

            // Inset root content view so webview never collides with status bar or navigation bar
            View contentView = findViewById(android.R.id.content);
            if (contentView != null) {
                ViewCompat.setOnApplyWindowInsetsListener(contentView, (v, windowInsets) -> {
                    Insets insets = windowInsets.getInsets(
                        WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
                    );
                    v.setPadding(insets.left, insets.top, insets.right, insets.bottom);
                    return windowInsets;
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
