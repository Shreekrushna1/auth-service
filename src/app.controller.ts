import { Controller, Inject } from '@nestjs/common';
import {
  MessagePattern,
  ClientProxy,
  RpcException,
  Payload,
} from '@nestjs/microservices';
import * as jwt from 'jsonwebtoken';
import { firstValueFrom } from 'rxjs';

const SECRET = 'Testkey';

@Controller()
export class AppController {
  constructor(
    @Inject('USER_SERVICE')
    private userClient: ClientProxy,
  ) {}

  @MessagePattern('generate_token')
  async generateToken(@Payload() email: string) {

    const user = await firstValueFrom(
      this.userClient.send('find_by_email', email),
    );

    if (!user) {
      throw new RpcException({
        statusCode: 401,
        message: 'Email not registered',
      });
    }

    const token = jwt.sign(
      {
        email: user.email,
        id: user._id.toString(),
      },
      SECRET,
      { expiresIn: '1h' },
    );

    return {
      access_token: token,
      expires_in: '1h',
      email: user.email,
    };
  }

  @MessagePattern('validate_token')
  validateToken(@Payload() token: string) {
    try {
      const decoded = jwt.verify(token, SECRET);
      return { valid: true, user: decoded };
    } catch {
      return {
        valid: false,
        message: 'Invalid or expired token',
      };
    }
  }
}