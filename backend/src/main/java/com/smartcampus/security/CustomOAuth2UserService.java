package com.smartcampus.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import com.smartcampus.model.UserAccount;
import com.smartcampus.model.UserRole;
import com.smartcampus.service.UserAccountService;

import java.util.Collection;
import java.util.HashSet;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserAccountService userAccountService;

    public CustomOAuth2UserService(UserAccountService userAccountService) {
        this.userAccountService = userAccountService;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User user = super.loadUser(userRequest);
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        UserRole desiredRole = "google-technician".equalsIgnoreCase(registrationId)
                ? UserRole.ROLE_TECHNICIAN
                : UserRole.ROLE_USER;
        UserAccount account = userAccountService.saveOrUpdateFromOAuth(user, desiredRole);

        Collection<GrantedAuthority> authorities = new HashSet<>(user.getAuthorities());
        authorities.add(new SimpleGrantedAuthority(account.getRole().name()));

        String nameAttributeKey = userRequest.getClientRegistration()
                .getProviderDetails()
                .getUserInfoEndpoint()
                .getUserNameAttributeName();

        return new DefaultOAuth2User(authorities, user.getAttributes(), nameAttributeKey);
    }
}
