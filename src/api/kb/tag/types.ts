export interface KbTagVO {
  id: string | number;
  name: string;
  createTime?: string;
  createBy?: string | number;
  createByName?: string;
}

export interface KbTagForm {
  id?: string | number;
  name?: string;
}

export interface KbTagQuery extends PageQuery {
  name?: string;
  keyword?: string;
}
