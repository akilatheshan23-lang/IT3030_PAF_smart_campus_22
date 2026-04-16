package com.smartcampus.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final Set<String> adminEmails;

    public CustomOAuth2UserService(@Value("${app.security.admin-emails:}") String adminEmails) {
        this.adminEmails = parseAdminEmails(adminEmails);
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User user = super.loadUser(userRequest);
        String email = user.getAttribute("email");

        Collection<GrantedAuthority> authorities = new HashSet<>(user.getAuthorities());
        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));

        if (email != null && adminEmails.contains(email.toLowerCase(Locale.ROOT))) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }

        String nameAttributeKey = userRequest.getClientRegistration()
                .getProviderDetails()
                .getUserInfoEndpoint()
                .getUserNameAttributeName();

        return new DefaultOAuth2User(authorities, user.getAttributes(), nameAttributeKey);
    }

    private Set<String> parseAdminEmails(String adminEmails) {
        if (adminEmails == null || adminEmails.isBlank()) {
            return Set.of();
        }

        return Stream.of(adminEmails.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(value -> value.toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());
    }
}
