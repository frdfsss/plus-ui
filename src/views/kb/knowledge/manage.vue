<template>
  <div class="p-2 app-container kb-knowledge-manage">
    <div class="search-wrap">
      <el-card shadow="hover" class="search-panel" :class="{ 'is-collapsed': !showSearch }">
        <template #header>
          <div class="panel-heading search-panel-toggle" @click.stop="showSearch = !showSearch">
            <div><h3>筛选条件</h3></div>
          </div>
        </template>
        <el-form ref="queryFormRef" :model="queryParams" :inline="true" class="query-form">
          <el-form-item label="关键字" prop="keyword">
            <el-input
              v-model="queryParams.keyword"
              placeholder="标题或标签"
              clearable
              style="width: 240px"
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="queryParams.status" placeholder="知识状态" clearable style="width: 180px">
              <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>知识库管理</h3>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['kb:knowledge:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
            <el-button
              v-hasPermi="['kb:knowledge:edit']"
              type="success"
              plain
              icon="Edit"
              :disabled="single"
              @click="handleUpdate()"
            >
              修改
            </el-button>
            <el-button
              v-hasPermi="['kb:knowledge:remove']"
              type="danger"
              plain
              icon="Delete"
              :disabled="multiple"
              @click="handleDelete()"
            >
              删除
            </el-button>
            <right-toolbar v-model:show-search="showSearch" :search="false" @query-table="getList"></right-toolbar>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" border class="data-table" :data="knowledgeList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="标题" align="left" prop="title" min-width="200" show-overflow-tooltip />
        <el-table-column label="标签" align="center" prop="tags" min-width="140" show-overflow-tooltip>
          <template #default="scope">
            <el-tag v-for="tag in splitTags(scope.row.tags)" :key="tag" size="small" class="kb-tag">{{ tag }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status" width="100">
          <template #default="scope">
            <dict-tag :options="statusOptions" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="附件" align="center" prop="fileName" min-width="120" show-overflow-tooltip />
        <el-table-column label="创建人" align="center" prop="createByName" width="100" />
        <el-table-column label="创建时间" align="center" prop="createTime" width="170" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="120">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['kb:knowledge:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['kb:knowledge:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="820px" append-to-body>
      <el-form ref="knowledgeFormRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="知识标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入知识标题" maxlength="255" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="项目名称" prop="projectName">
          <el-input v-model="form.projectName" placeholder="可选，来源项目名称" maxlength="255" />
        </el-form-item>
        <el-form-item label="标签" prop="tagNames">
          <el-select
            v-model="form.tagNames"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入标签后回车"
            style="width: 100%"
          >
            <el-option v-for="item in tagOptions" :key="item.id" :label="item.name" :value="item.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="附件" prop="filePath">
          <file-upload v-model="form.filePath" :limit="1" :file-type="['pdf']" :file-size="20" />
        </el-form-item>
        <el-form-item label="正文内容" prop="content">
          <editor v-model="form.content" :min-height="280" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="KbKnowledgeManage" lang="ts">
import { addKnowledge, delKnowledge, getKnowledge, listKnowledge, updateKnowledge } from '@/api/kb/knowledge';
import { KnowledgeForm, KnowledgeQuery, KnowledgeVO } from '@/api/kb/knowledge/types';
import { listKbTagAll } from '@/api/kb/tag';
import { KbTagVO } from '@/api/kb/tag/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useFormDialog } from '@/hooks/dialog/useFormDialog';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { useTableSelection } from '@/hooks/table/useTableSelection';
import modal from '@/plugins/modal';
import { useDict } from '@/utils/dict';

const knowledgeList = ref<KnowledgeVO[]>([]);
const tagOptions = ref<KbTagVO[]>([]);
const buttonLoading = ref(false);
const { loading, withLoading } = useLoading(true);
const { showSearch } = useSearchToggle();
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const knowledgeFormRef = ref<ElFormInstance>();
const { yw_knowledge_status: statusOptions } = useDict('yw_knowledge_status');

const initFormData: KnowledgeForm = {
  id: undefined,
  title: undefined,
  content: '',
  filePath: undefined,
  fileName: undefined,
  projectId: undefined,
  projectName: undefined,
  tags: undefined,
  status: '2',
  tagNames: []
};

const data = reactive<PageData<KnowledgeForm, KnowledgeQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    keyword: undefined,
    status: undefined
  },
  rules: {
    title: [{ required: true, message: '知识标题不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);
const { ids, single, multiple, handleSelectionChange } = useTableSelection<KnowledgeVO>(item => item.id);
const {
  dialog,
  resetForm: reset,
  openDialog,
  showDialog,
  closeDialog
} = useFormDialog({
  form,
  formRef: knowledgeFormRef,
  initialFormData: initFormData
});

const splitTags = (tags?: string) => {
  if (!tags) return [];
  return tags
    .split(/[,，;；]/)
    .map((item: string) => item.trim())
    .filter((item: string) => !!item);
};

const loadTags = async () => {
  const res = await listKbTagAll({});
  tagOptions.value = res.data ?? [];
};

const getList = async () => {
  await withLoading(async () => {
    const res = await listKnowledge(queryParams.value);
    knowledgeList.value = res.data?.rows ?? [];
    total.value = res.data?.total ?? 0;
  });
};

const cancel = () => {
  reset();
  closeDialog();
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const { resetQuery } = useSearchReset({
  queryFormRef,
  queryParams,
  pageNumKey: 'pageNum',
  afterReset: () => {
    handleQuery();
  }
});

const handleAdd = () => {
  openDialog('添加知识');
};

const handleUpdate = async (row?: Partial<KnowledgeVO>) => {
  reset();
  const knowledgeId = row?.id || ids.value[0];
  const res = await getKnowledge(knowledgeId);
  Object.assign(form.value, res.data);
  form.value.tagNames = splitTags(res.data?.tags);
  showDialog('修改知识');
};

const submitForm = () => {
  knowledgeFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      try {
        const payload = {
          ...form.value,
          tags: (form.value.tagNames ?? []).join(','),
          tagNames: form.value.tagNames ?? []
        };
        if (form.value.id) {
          await updateKnowledge(payload);
          modal.msgSuccess('修改成功');
        } else {
          await addKnowledge(payload);
          modal.msgSuccess('新增成功');
        }
        closeDialog();
        await getList();
        await loadTags();
      } finally {
        buttonLoading.value = false;
      }
    }
  });
};

const handleDelete = async (row?: Partial<KnowledgeVO>) => {
  const knowledgeIds = row?.id || ids.value;
  await modal.confirm('是否确认删除知识编号为"' + knowledgeIds + '"的数据项？');
  await delKnowledge(knowledgeIds);
  modal.msgSuccess('删除成功');
  await getList();
};

onMounted(async () => {
  await Promise.all([getList(), loadTags()]);
});
</script>

<style scoped lang="scss">
.kb-tag {
  margin-right: 4px;
  margin-bottom: 2px;
}
</style>
