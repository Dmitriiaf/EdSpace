// ЗАМЕНИТЬ ВЕСЬ ФАЙЛ НА:
package com.example.demo.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.time.LocalTime;

@Slf4j
@Controller
public class BoardWebSocketController {

    @MessageMapping("/board/{roomName}")
    @SendTo("/topic/board/{roomName}")
    public String handleBoardMessage(@DestinationVariable String roomName, String message) {
        log.info("📝 [WS] Комната: {}, данные: {}", roomName,
                message != null ? message.substring(0, Math.min(80, message.length())) : "null");
        return message;
    }
}