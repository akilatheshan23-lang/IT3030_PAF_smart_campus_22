package com.smartcampus.service;

import com.smartcampus.model.UserAccount;
import com.smartcampus.model.UserRole;
import com.smartcampus.repository.UserAccountRepository;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Locale;

@Service
public class UserAccountService {

    private final UserAccountRepository userAccountRepository;

    public UserAccountService(UserAccountRepository userAccountRepository) {
        this.userAccountRepository = userAccountRepository;
    }

    public UserAccount saveOrUpdateFromOAuth(OAuth2User oauthUser, UserRole desiredRole) {
        String email = normalizeEmail(oauthUser.getAttribute("email"));
        String name = oauthUser.getAttribute("name");
        String picture = oauthUser.getAttribute("picture");
        Instant now = Instant.now();

        UserAccount account = userAccountRepository.findByEmail(email).orElseGet(UserAccount::new);

        boolean isNew = account.getId() == null;
        if (isNew) {
            account.setCreatedAt(now);
            account.setRole(desiredRole != null ? desiredRole : UserRole.ROLE_USER);
        } else if (account.getRole() != UserRole.ROLE_ADMIN && desiredRole != null) {
            account.setRole(desiredRole);
        }

        account.setEmail(email);
        account.setName(name != null ? name : email);
        account.setPictureUrl(picture);
        account.setLastLogin(now);

        return userAccountRepository.save(account);
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
