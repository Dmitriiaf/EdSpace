package com.example.demo.service;

import com.example.demo.entity.Tutor;
import com.example.demo.exception.BusinessException;
import com.example.demo.exception.NotFoundException;
import com.example.demo.repository.TutorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
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
            // ✅ Заменено на BusinessException
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
            // ✅ Заменено на NotFoundException с параметрами
            throw new NotFoundException("Репетитор", "email", email);
        }

        Tutor tutor = optionalTutor.get();

        if (!passwordEncoder.matches(password, tutor.getPasswordHash())) {
            // ✅ Заменено на BusinessException
            throw new BusinessException("Неверный пароль");
        }

        return tutor;
    }

    public Tutor getTutorById(Long id) {
        return tutorRepository.findById(id)
                // ✅ Заменено на NotFoundException с параметрами
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

    public void changePassword(Long id, String currentPassword, String newPassword) {
        Tutor tutor = getTutorById(id);

        if (!passwordEncoder.matches(currentPassword, tutor.getPasswordHash())) {
            // ✅ Заменено на BusinessException
            throw new BusinessException("Неверный текущий пароль");
        }

        if (newPassword == null || newPassword.length() < 6) {
            // ✅ Заменено на BusinessException
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