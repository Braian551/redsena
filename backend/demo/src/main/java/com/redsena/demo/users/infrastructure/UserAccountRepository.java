package com.redsena.demo.users.infrastructure;

import com.redsena.demo.users.domain.UserAccount;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, UUID> {

	Optional<UserAccount> findByFirebaseSubject(String firebaseSubject);
}
