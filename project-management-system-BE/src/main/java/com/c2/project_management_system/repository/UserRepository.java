package com.c2.project_management_system.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.statusEnum.AccountRole;
import com.c2.project_management_system.statusEnum.AccountStatus;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

	Optional<User> findByEmail(String email);

	Optional<User> findByFullName(String fullname);

	boolean existsByEmail(String email);

	boolean existsByFullName(String fullName);

	List<User> findByRole(AccountRole role);

	List<User> findByStatus(AccountStatus status);

	List<User> findByFullNameContainingIgnoreCase(String keyword);

	@Query("""
			    SELECT u
			    FROM User u
			    WHERE LOWER(u.fullName) LIKE LOWER(CONCAT('%', :q, '%'))
			       OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%'))
			    ORDER BY u.fullName
			""")
	List<User> searchUsers(@Param("q") String q);
	
	
    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    long countByRoleAndStatus(AccountRole role, AccountStatus status);

    @Query("SELECT u FROM User u WHERE " +
            "(:keyword IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "                  OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
            "(:role IS NULL OR u.role = :role) AND " +
            "(:status IS NULL OR u.status = :status)  AND " +
            "(u.role != ADMIN)")
     Page<User> findUsersByFilters(
             @Param("keyword") String keyword,
             @Param("role") AccountRole role,
             @Param("status") AccountStatus status,
             Pageable pageable
     );
    
    Page<User> findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String fullName,
            String email,
            Pageable pageable
    );
}
