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

@RestController
@RequestMapping("/api/customer")
@RequiredArgsConstructor
public class CustomerController {

    private final BillService billService;
    private final UserRepository userRepository;

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
        return userRepository.findByEmailIgnoreCase(userDetails.getUsername())
                .orElseThrow().getId();
    }
}
