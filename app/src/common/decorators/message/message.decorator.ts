import { SetMetadata } from '@nestjs/common';
import { MESSAGE_KEY } from 'src/common/constants';

export const Message = (msg: string) => SetMetadata(MESSAGE_KEY, msg);
