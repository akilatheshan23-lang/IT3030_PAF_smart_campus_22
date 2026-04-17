package com.smartcampus.security;

import com.smartcampus.model.UserAccount;
import com.smartcampus.model.UserRole;
import com.smartcampus.service.UserAccountService;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.HashSet;

@Service
public class CustomOidcUserService extends OidcUserService {

    private final UserAccountService userAccountService;

    public CustomOidcUserService(UserAccountService userAccountService) {
        this.userAccountService = userAccountService;
    }

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = super.loadUser(userRequest);
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        UserRole desiredRole = "google-technician".equalsIgnoreCase(registrationId)
                ? UserRole.ROLE_TECHNICIAN
                : UserRole.ROLE_USER;

        UserAccount account = userAccountService.saveOrUpdateFromOAuth(oidcUser, desiredRole);

        Collection<GrantedAuthority> authorities = new HashSet<>(oidcUser.getAuthorities());
        authorities.add(new SimpleGrantedAuthority(account.getRole().name()));

        String nameAttributeKey = userRequest.getClientRegistration()
                .getProviderDetails()
                .getUserInfoEndpoint()
                .getUserNameAttributeName();

        return new DefaultOidcUser(authorities, oidcUser.getIdToken(), oidcUser.getUserInfo(), nameAttributeKey);
    }
}
