<template>
  <div class="p-2 app-container kb-tag-page">
    <div class="search-wrap">
      <el-card shadow="hover" class="search-panel" :class="{ 'is-collapsed': !showSearch }">
        <template #header>
          <div class="panel-heading search-panel-toggle" @click.stop="showSearch = !showSearch">
            <div><h3>筛选条件</h3></div>
          </div>
        </template>
        <el-form ref="queryFormRef" :model="queryParams" :inline="true" class="query-form">
          <el-form-item label="标签名称" prop="keyword">
            <el-input v-model="queryParams.keyword" placeholder="请输入标签名称" clearable @keyup.enter="handleQuery" />
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
            <h3>知识标签</h3>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['kb:tag:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
            <el-button
              v-hasPermi="['kb:tag:edit']"
              type="success"
              plain
              icon="Edit"
              :disabled="single"
              @click="handleUpdate()"
            >
              修改
            </el-button>
            <el-button
              v-hasPermi="['kb:tag:remove']"
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

      <el-table v-loading="loading" border class="data-table" :data="tagList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="标签名称" align="center" prop="name" min-width="160" />
        <el-table-column label="创建人" align="center" prop="createByName" width="120" />
        <el-table-column label="创建时间" align="center" prop="createTime" width="170" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="120">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['kb:tag:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['kb:tag:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
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

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="480px" append-to-body>
      <el-form ref="tagFormRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="标签名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入标签名称" maxlength="100" />
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

<script setup name="KbTag" lang="ts">
import { addKbTag, delKbTag, getKbTag, listKbTag, updateKbTag } from '@/api/kb/tag';
import { KbTagForm, KbTagQuery, KbTagVO } from '@/api/kb/tag/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useFormDialog } from '@/hooks/dialog/useFormDialog';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { useTableSelection } from '@/hooks/table/useTableSelection';
import modal from '@/plugins/modal';

const tagList = ref<KbTagVO[]>([]);
const buttonLoading = ref(false);
const { loading, withLoading } = useLoading(true);
const { showSearch } = useSearchToggle();
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const tagFormRef = ref<ElFormInstance>();

const initFormData: KbTagForm = {
  id: undefined,
  name: undefined
};

const data = reactive<PageData<KbTagForm, KbTagQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    keyword: undefined
  },
  rules: {
    name: [{ required: true, message: '标签名称不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);
const { ids, single, multiple, handleSelectionChange } = useTableSelection<KbTagVO>(item => item.id);
const {
  dialog,
  resetForm: reset,
  openDialog,
  showDialog,
  closeDialog
} = useFormDialog({
  form,
  formRef: tagFormRef,
  initialFormData: initFormData
});

const getList = async () => {
  await withLoading(async () => {
    const res = await listKbTag(queryParams.value);
    tagList.value = res.data?.rows ?? [];
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
  openDialog('添加标签');
};

const handleUpdate = async (row?: Partial<KbTagVO>) => {
  reset();
  const tagId = row?.id || ids.value[0];
  const res = await getKbTag(tagId);
  Object.assign(form.value, res.data);
  showDialog('修改标签');
};

const submitForm = () => {
  tagFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      try {
        if (form.value.id) {
          await updateKbTag(form.value);
          modal.msgSuccess('修改成功');
        } else {
          await addKbTag(form.value);
          modal.msgSuccess('新增成功');
        }
        closeDialog();
        await getList();
      } finally {
        buttonLoading.value = false;
      }
    }
  });
};

const handleDelete = async (row?: Partial<KbTagVO>) => {
  const tagIds = row?.id || ids.value;
  await modal.confirm('是否确认删除标签编号为"' + tagIds + '"的数据项？');
  await delKbTag(tagIds);
  modal.msgSuccess('删除成功');
  await getList();
};

onMounted(() => {
  getList();
});
</script>
