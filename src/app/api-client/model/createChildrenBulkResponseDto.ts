import { ChildCreatedDto } from './childCreatedDto';

export interface CreateChildrenBulkResponseDto {
  children?: ChildCreatedDto[] | null;
}
