package com.example.demo.service;

import com.example.demo.entity.Tutor;
import com.example.demo.exception.BusinessException;
import com.example.demo.exception.NotFoundException;
import com.example.demo.repository.TutorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class TutorService {

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Tutor registerTutor(String email, String password, String fullName, String phone) {
        if (tutorRepository.existsByEmail(email)) {
            throw new BusinessException("Репетитор с таким email уже существует");
        }

        Tutor tutor = new Tutor(
                email,
                passwordEncoder.encode(password),
                fullName,
                phone
        );

        return tutorRepository.save(tutor);
    }

    public Tutor login(String email, String password) {
        Optional<Tutor> optionalTutor = tutorRepository.findByEmail(email);

        if (optionalTutor.isEmpty()) {
            throw new NotFoundException("Репетитор", "email", email);
        }

        Tutor tutor = optionalTutor.get();

        if (!passwordEncoder.matches(password, tutor.getPasswordHash())) {
            throw new BusinessException("Неверный пароль");
        }

        return tutor;
    }

    public Tutor getTutorById(Long id) {
        return tutorRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Репетитор", "id", id));
    }

    public Tutor updateTutor(Long id, String phone, String fullName,
                             String birthday, String about, String city) {
        Tutor tutor = getTutorById(id);

        if (phone != null) tutor.setPhone(phone);
        if (fullName != null) tutor.setFullName(fullName);
        if (birthday != null && !birthday.isEmpty()) tutor.setBirthday(LocalDate.parse(birthday));
        if (about != null) tutor.setAbout(about);
        if (city != null) tutor.setCity(city);
        return tutorRepository.save(tutor);
    }

    public Tutor findByEmail(String email) {
        return tutorRepository.findByEmail(email).orElse(null);
    }

    public void saveResetToken(String email, String token) {
        Tutor tutor = tutorRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        tutor.setResetToken(token);
        tutor.setResetTokenExpiry(LocalDateTime.now().plusHours(24));
        tutorRepository.save(tutor);
    }

    public boolean resetPassword(String token, String newPassword) {
        Optional<Tutor> optionalTutor = tutorRepository.findByResetToken(token);

        if (optionalTutor.isEmpty()) {
            return false;
        }

        Tutor tutor = optionalTutor.get();

        // Проверить, не истёк ли токен
        if (tutor.getResetTokenExpiry() == null ||
                tutor.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            return false;
        }

        // Установить новый пароль
        tutor.setPasswordHash(passwordEncoder.encode(newPassword));
        tutor.setResetToken(null);
        tutor.setResetTokenExpiry(null);
        tutorRepository.save(tutor);

        return true;
    }

    public boolean isValidResetToken(String token) {
        Optional<Tutor> optionalTutor = tutorRepository.findByResetToken(token);

        if (optionalTutor.isEmpty()) {
            return false;
        }

        Tutor tutor = optionalTutor.get();

        return tutor.getResetTokenExpiry() != null &&
                tutor.getResetTokenExpiry().isAfter(LocalDateTime.now());
    }

    public void changePassword(Long id, String currentPassword, String newPassword) {
        Tutor tutor = getTutorById(id);

        if (!passwordEncoder.matches(currentPassword, tutor.getPasswordHash())) {
            throw new BusinessException("Неверный текущий пароль");
        }

        if (newPassword == null || newPassword.length() < 6) {
            throw new BusinessException("Пароль должен быть не менее 6 символов");
        }

        tutor.setPasswordHash(passwordEncoder.encode(newPassword));
        tutorRepository.save(tutor);
    }

    public List<Tutor> getAllTutors() {
        return tutorRepository.findAll();
    }

    public void updateAvatar(Long id, String avatarBase64) {
        Tutor tutor = getTutorById(id);
        tutor.setAvatar(avatarBase64);
        tutorRepository.save(tutor);
    }
}