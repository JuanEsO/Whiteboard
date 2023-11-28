package com.udea.taxi.Controller;

import com.udea.taxi.model.Coordenadas;
import com.udea.taxi.model.Offsets;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin("*")
public class DrawController {
    private final SimpMessagingTemplate template;

    public DrawController(SimpMessagingTemplate template){
        this.template= template;
    }

    @PostMapping("/send-offset")
    public void sendOffset(@RequestBody Offsets offsets){
        System.out.println("Coordenada recibida: " + offsets);
        this.template.convertAndSend("/whiteboard/offset", offsets);
    }

}