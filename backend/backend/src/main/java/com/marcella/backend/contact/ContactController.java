package com.marcella.backend.contact;

import com.marcella.backend.services.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
public class ContactController {
    private final EmailService emailService;

    @PostMapping
    public ResponseEntity<String> sendContactMessage(
            @RequestBody ContactRequest request
    ){
        String subject="Contact Form Submission from " + request.getName();

        String body="Sender: " + request.getName() + "\n" +
                "Email: " + request.getEmail() + "\n\n" +
                "Subject: " + request.getSubject() + "\n" +
                "Page Issue Occurred On: " + request.getPage() + "\n\n" +
                "Message: " + request.getMessage();

        emailService.sendEmail("marcellapearl0627@gmail.com", subject, body);
        return ResponseEntity.ok("Message sent successfully!");
    }
}
