export interface KnowledgeVO {
  id: string | number;
  title: string;
  content?: string;
  filePath?: string;
  fileName?: string;
  projectId?: string | number;
  projectName?: string;
  tags?: string;
  status?: string;
  originId?: string | number;
  approveBy?: string | number;
  approveByName?: string;
  approveTime?: string;
  approveRemark?: string;
  createTime?: string;
  createBy?: string | number;
  createByName?: string;
  updateTime?: string;
  updateBy?: string | number;
}

export interface KnowledgeForm {
  id?: string | number;
  title?: string;
  content?: string;
  filePath?: string;
  fileName?: string;
  projectId?: string | number;
  projectName?: string;
  tags?: string;
  status?: string;
  tagNames?: string[];
}

export interface KnowledgeQuery extends PageQuery {
  title?: string;
  keyword?: string;
  status?: string;
  projectId?: string | number;
}
