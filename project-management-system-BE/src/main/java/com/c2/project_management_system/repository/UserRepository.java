package com.c2.project_management_system.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.statusEnum.AccountRole;
import com.c2.project_management_system.statusEnum.AccountStatus;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    List<User> findByRole(AccountRole role);

    List<User> findByStatus(AccountStatus status);

    List<User> findByFullNameContainingIgnoreCase(String keyword);
}
