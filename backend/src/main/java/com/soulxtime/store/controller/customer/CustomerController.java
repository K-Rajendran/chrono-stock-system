package com.soulxtime.store.controller.customer;

import com.soulxtime.store.dto.response.BillResponse;
import com.soulxtime.store.repository.UserRepository;
import com.soulxtime.store.service.BillService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import com.soulxtime.store.entity.User;
import java.util.Map;

@RestController
@RequestMapping("/api/customer")
@RequiredArgsConstructor
public class CustomerController {

    private final BillService billService;
    private final UserRepository userRepository;

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(toProfile(getUser(userDetails)));
    }

    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {
        User user = getUser(userDetails);
        String fullName = body.get("fullName");
        String phone = body.get("phone");
        if (fullName != null && !fullName.isBlank()) user.setFullName(fullName.trim());
        if (phone != null) user.setPhone(phone.trim());
        return ResponseEntity.ok(toProfile(userRepository.save(user)));
    }

    @GetMapping("/bills")
    public ResponseEntity<Page<BillResponse>> getMyBills(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(
                billService.getCustomerBills(getUserId(userDetails), PageRequest.of(page, size)));
    }

    @GetMapping("/bills/{billId}")
    public ResponseEntity<BillResponse> getBill(
            @PathVariable Long billId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                billService.getBillById(billId, getUserId(userDetails), false));
    }

    private Long getUserId(UserDetails userDetails) {
        return getUser(userDetails).getId();
    }

    private User getUser(UserDetails userDetails) {
        return userRepository.findByEmailIgnoreCase(userDetails.getUsername()).orElseThrow();
    }

    private Map<String, Object> toProfile(User user) {
        return Map.of("id", user.getId(), "fullName", user.getFullName(), "email", user.getEmail(),
                "phone", user.getPhone() == null ? "" : user.getPhone(), "role", user.getRole().name());
    }
}
