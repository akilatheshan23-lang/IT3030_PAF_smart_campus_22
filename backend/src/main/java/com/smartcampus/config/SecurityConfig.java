package com.smartcampus.config;

import com.smartcampus.security.CustomOAuth2UserService;
import com.smartcampus.security.CustomOidcUserService;
import com.smartcampus.security.OAuth2LoginSuccessHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

@Configuration
public class SecurityConfig {

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public UserDetailsService userDetailsService(
                        @Value("${app.security.admin-username:admin}") String adminUsername,
                        @Value("${app.security.admin-password:admin123}") String adminPassword,
                        PasswordEncoder passwordEncoder) {
                return new InMemoryUserDetailsManager(User.withUsername(adminUsername)
                                .password(passwordEncoder.encode(adminPassword))
                                .roles("ADMIN")
                                .build());
        }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   OAuth2LoginSuccessHandler successHandler,
                                                   CustomOAuth2UserService userService,
                                                   CustomOidcUserService oidcUserService) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/home/**", "/api/resources/public").permitAll()
                        .requestMatchers("/api/auth/google/**", "/api/auth/admin/login").permitAll()
                        .requestMatchers("/api/auth/**", "/oauth2/**", "/login/**", "/error").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/technician/**").hasRole("TECHNICIAN")
                        .requestMatchers("/api/user/**").hasAnyRole("USER", "ADMIN")
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth -> oauth
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(userService)
                                .oidcUserService(oidcUserService)
                        )
                        .successHandler(successHandler)
                )
                .formLogin(form -> form
                        .loginProcessingUrl("/api/auth/admin/login")
                        .successHandler((request, response, authentication) -> response.setStatus(204))
                        .failureHandler((request, response, exception) -> response.sendError(401, "Invalid credentials"))
                )
                .exceptionHandling(exceptions -> exceptions
                        .defaultAuthenticationEntryPointFor(
                                new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                                new AntPathRequestMatcher("/api/**")
                        )
                )
                .logout(logout -> logout
                        .logoutRequestMatcher(new AntPathRequestMatcher("/api/auth/logout", "POST"))
                        .logoutSuccessHandler((request, response, authentication) -> response.setStatus(204))
                );

        return http.build();
    }
}
