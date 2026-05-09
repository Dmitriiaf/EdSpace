package com.example.demo.controller;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class BoardWebSocketController {



    @MessageMapping("/board/{roomName}")
    @SendTo("/topic/board/{roomName}")
    public String handleBoardMessage(@DestinationVariable String roomName, String message) {
        return message;
    }



}