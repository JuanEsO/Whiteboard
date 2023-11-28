package com.udea.taxi.Controller;

import com.udea.taxi.model.Coordenadas;
import com.udea.taxi.model.Offsets;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class OffsetController {

    @MessageMapping("/whiteboard")
    @SendTo("/whiteboard/offset")
    public Offsets envio(Offsets offsets){
        return offsets;
    }

}