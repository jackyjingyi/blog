/**
 * 轻量任务-任务任务详情
 * Created by wrb on 2019/12/10.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_light_project_task_detail",
        defaults = {
            isDialog:true,
            doType:1,//doType==2==创建模板
            fromType:null,//fromType==1任务进来fromType==2模板编辑进来
            dataInfo:null,
            groupList:null,
            groupId:null,//暂时未用到，成员看板进来，此字段不是原groupId
            lightProjectId:null,
            taskId:null,
            saveCallBack:null,
            closeCallBack:null,
            refreshParentCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyUserId = window.currentCompanyUserId;
        this._currentCompanyUserName = window.companyUserInfo.userName;

        this._dataInfo = this.settings.dataInfo;

        if(this.settings.doType==2 && this._dataInfo.checkItemList==null)
            this._dataInfo.checkItemList = [];

        if(this.settings.doType==2 && this._dataInfo.memberList==null)
            this._dataInfo.memberList = [];

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.getDataInfo(function () {
                //console.log(that._dataInfo);
                var html = template('m_light_project/m_light_project_task_detail', {
                    dataInfo:that._dataInfo,
                    groupList:that.settings.groupList,
                    currentCompanyUserName:that._currentCompanyUserName,
                    doType:that.settings.doType,
                    fromType:that.settings.fromType
                });
                that.renderDialog(html,function () {


                    if(that.settings.doType==1){
                        that.renderComment();
                        that.renderHistory();
                    }

                    if(!(that.settings.doType==1 && that.settings.fromType!=2)){
                        $(that.element).find('button[data-action="addComment"],button[data-action="selectUser"]').attr('disabled',true).removeAttr('data-action');
                    }

                    that.bindActionClick();
                    that.initItemICheck();
                    that.setPercentage();
                    that.bindEditable();
                    that.sortTable();

                });
            });
        }
        //渲染界面
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    area : '750px',
                    closeBtn :0,
                    content:html,
                    btn:false

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if(callBack)
                        callBack();
                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }
        }
        //渲染评论
        ,renderComment:function () {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_lightProject_getCommentList;
            option.postData = {};
            option.postData.id = that.settings.taskId;

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    var html = template('m_light_project/m_light_project_task_detail_comment', {
                        dataList:response.data
                    });
                    $(that.element).find('.panel-body[data-type="comment"]').html(html);

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //变更历史
        ,renderHistory:function () {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_lightProject_listHistoryForLightProject;
            option.postData = {};
            option.postData.historyId = that.settings.taskId;

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    var html = template('m_light_project/m_light_project_task_detail_history', {
                        dataList:response.data
                    });
                    $(that.element).find('.panel-body[data-type="history"]').html(html);

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //查询详情
        ,getDataInfo:function (callBack) {
            var that = this;
            if(that.settings.doType==2){
                if(callBack)
                    callBack();
            }else{
                var option = {};
                option.classId = that.element;
                option.url = restApi.url_lightProject_getLightProjectTaskDetail;
                option.postData = {};
                option.postData.id = that.settings.taskId;

                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {

                        that._dataInfo = response.data;

                        if(callBack)
                            callBack();

                    } else {
                        S_layer.error(response.info);
                    }
                });
            }
        }
        //初始ICheck
        ,initItemICheck:function () {
            var that = this;

            var ifChecked = function (e) {

                $(this).parents('.task-item').find('.task-name').addClass('todo-completed');
                var id = $(this).attr('data-id');
                var type = $(this).parents('.i-checks').attr('data-type');
                that.saveLightProjectTaskComplete({id:id,isComplete:1},function () {

                    if(type==2){//核对清单
                        that.setPercentage();
                    }

                },$(this));
            };
            var ifUnchecked = function (e) {
                $(this).parents('.task-item').find('.task-name').removeClass('todo-completed');
                var id = $(this).attr('data-id');
                var type = $(this).parents('.i-checks').attr('data-type');
                that.saveLightProjectTaskComplete({id:id,isComplete:0},function () {
                    if(type==2){//核对清单
                        that.setPercentage();
                    }
                },$(this));
            };
            $(that.element).find('input[name="taskItem"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked);
        }
        //设置核对清单完成百分比
        ,setPercentage : function () {
            var that = this;
            var checkLen = $(that.element).find('.checklist-list input[name="taskItem"]:checked').length;
            var itemLen = $(that.element).find('.checklist-list input[name="taskItem"]').length;
            var percentage = Math.round((math.divide(math.bignumber(checkLen),math.bignumber(itemLen)))*100);
            if(checkLen==0)
                percentage = 0;

            $(that.element).find('.checklist-progress .checklist-progress-num').html(percentage+'%');
            $(that.element).find('.checklist-progress .progress-bar').css('width',percentage+'%');

            if(that.settings.doType==2){
                that._dataInfo.task.checkItemSize=itemLen;
                that._dataInfo.task.completeCheckItemSize=checkLen;
            }
        }
        //设置完成与否
        ,saveLightProjectTaskComplete:function (data,callBack,$this) {
            var that = this;
            if(that.settings.doType==2){
                var type = $this.parents('.i-checks').attr('data-type');

                if(type==2){//核对清单

                    $.each(that._dataInfo.checkItemList,function (i,item) {
                        if(item.id==data.id){
                            item.isComplete = data.isComplete;
                            if(data.isComplete==1){//完成
                                item.completeDate = moment().format('YYYY-MM-DD');
                            }else{
                                item.completeDate = null;
                            }
                            return false;
                        }
                    });

                }else{
                    that._dataInfo.task.isComplete = data.isComplete;
                    if(data.isComplete==1){//完成
                        that._dataInfo.task.completeDate = moment().format('YYYY-MM-DD');
                    }else{
                        that._dataInfo.task.completeDate = null;
                    }
                }
                if(callBack)
                    callBack();

            }else{
                var option = {};
                option.classId = that.element;
                option.url = restApi.url_lightProject_saveLightProjectTaskComplete;
                option.postData = data;
                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {

                        S_toastr.success('操作成功！');
                        if(callBack)
                            callBack();

                    } else {
                        S_layer.error(response.info);
                    }
                });
            }
        }
        //保存任务
        ,saveTask:function (data,callBack) {
            var that = this;

            //console.log(data);
            if(that.settings.doType==2){

                $.extend(that._dataInfo.task, data);
                if(callBack){
                    callBack();
                }else{
                    that.init();
                }
            }else{
                var option = {};
                option.classId = that.element;
                option.url = restApi.url_lightProject_saveTask;
                option.postData = data;
                option.postData.id = that.settings.taskId;
                option.postData.lightProjectId = that.settings.lightProjectId;
                option.postData.groupId = that._dataInfo.task.groupId;
                option.postData.type = 1;

                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {
                        if(callBack){
                            callBack();
                        }else{
                            S_toastr.success('操作成功！');
                            that.init();
                        }
                        if(that.settings.saveCallBack)
                            that.settings.saveCallBack();

                    } else {
                        S_layer.error(response.info);
                    }
                });
            }

        }
        //保存
        ,saveCheckList:function (data,$this) {
            var that = this;
            if(that.settings.doType==2){

                if(data!=null){
                    var checkItemId = $this.closest('.checklist-item').attr('data-id');
                    $.each(that._dataInfo.checkItemList,function (i,item) {
                        if(item.id==checkItemId){
                            $.extend(item, data);
                        }
                    });
                }else{
                    that._dataInfo.checkItemList.push({
                        type:2,
                        taskName:$(that.element).find('input[name="checkListItemName"]').val(),
                        id:UUID.genV4().hexNoDelim
                    })
                }
                that.init();

            }else{
                var option = {};
                option.classId = that.element;
                option.url = restApi.url_lightProject_saveCheckItem;
                option.postData = {};
                if(data!=null){
                    option.postData = data;
                }else{
                    option.postData.taskName = $(that.element).find('input[name="checkListItemName"]').val();
                }
                option.postData.type = 2;
                option.postData.groupId = that._dataInfo.task.groupId;
                option.postData.lightProjectId = that.settings.lightProjectId;
                option.postData.pid = that.settings.taskId;

                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {

                        S_toastr.success('操作成功！');

                        that.init();

                        if(that.settings.saveCallBack)
                            that.settings.saveCallBack();

                    } else {
                        S_layer.error(response.info);
                    }
                });
            }

        }
        //保存负责人{type=1=负责人,type=2=参与人}
        ,savePrincipal:function (type,userList) {
            var that = this;
            if(that.settings.doType==2){

                if(userList==false){
                    if(type==1){
                        that._dataInfo.principalUser = null;
                    }else{
                        that._dataInfo.memberList = [];
                    }
                }else{
                    if(type==1){//负责人
                        that._dataInfo.principalUser = {companyUserId:userList.principalUsrId[0].id,userName:userList.principalUsrId[0].text};
                    }else{
                        that._dataInfo.memberList = [];
                        $.each(userList.principalUsrId,function (i,item) {
                            that._dataInfo.memberList.push({companyUserId:item.id,userName:item.text});
                        });
                    }
                }
                that.init();

            }else{
                var option = {};
                option.classId = that.element;
                option.url = restApi.url_lightProject_savePrincipal;
                option.postData = {};
                option.postData.id = that.settings.taskId;

                if(type==2){//参与人
                    option.url = restApi.url_lightProject_saveLightProjectTaskMember;
                    option.postData.memberList = [];
                    if(userList!=false){
                        $.each(userList.principalUsrId,function (i,item) {
                            option.postData.memberList.push({id:item.id});
                        });
                    }
                }else{//负责人
                    option.postData.principalUsrId = userList==false?null:userList.principalUsrId[0].id;
                }

                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {

                        S_toastr.success('操作成功！');
                        that.init();
                        if(that.settings.saveCallBack)
                            that.settings.saveCallBack();

                    } else {
                        S_layer.error(response.info);
                    }
                });
            }
        }
        //保存评论
        ,saveComment:function () {
            var that = this;
            var option={};
            option.classId = that.element;
            option.url=restApi.url_lightProject_commentLightProjectTask;
            option.postData = {
                taskId:that.settings.taskId,
                comment:$(that.element).find('.content-editable').html()
            };
            m_ajax.postJson(option,function (response) {

                if(response.code=='0'){
                    S_toastr.success('操作成功！');
                    that.init();
                }else {
                    S_layer.error(response.info);
                }
            });
        }
        //移动
        ,saveMoveTask:function (groupId) {
            var that = this;
            if(that.settings.doType==2){

                that.settings.groupId = groupId;
                that._dataInfo.task.groupId = groupId;


                if(that.settings.closeCallBack)
                    that.settings.closeCallBack(that._dataInfo);

            }else{
                var option = {};
                option.classId = that.element;
                option.url = restApi.url_lightProject_moveLightProjectTask;
                option.postData = {};
                option.postData.id = that.settings.taskId;
                option.postData.lightProjectId = that.settings.lightProjectId;
                option.postData.groupId = groupId;

                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {

                        S_toastr.success('操作成功！');

                        that.settings.groupId = groupId;
                        that._dataInfo.task.groupId = groupId;
                        that.init();
                        if(that.settings.closeCallBack)
                            that.settings.closeCallBack();

                    } else {
                        S_layer.error(response.info);
                    }
                });
            }
        }
        //在位编辑内容初始化
        ,bindEditable:function(){
            var that = this;
            $(that.element).find('a[data-action="xeditable"]').each(function () {
                var $this = $(this);
                var key = $this.attr('data-key');
                var value = $this.attr('data-value');
                var editType = $this.attr('data-edit-type');
                var dataInfo = null;
                var dataId = that._dataInfo.task.id;
                var dataItem = that._dataInfo.task;
                var noInternalInit = false;
                var targetNotQuickCloseArr = [];
                var popoverStyle={'max-width':'140px','top':'-3px'};

                if(key=='remark'){

                    popoverStyle = {'width':'100%','max-width':'100%','z-index': 'inherit'};
                    value = $this.html();
                    if($.trim($this.text())=='点击添加描述')
                        value = '';

                }else if(key=='taskName'){

                    popoverStyle = {'width':'540px','max-width':'540px','z-index': 'inherit','top': '-9px'};
                }
                $this.m_editable({
                    inline:true,
                    popoverStyle:popoverStyle,
                    hideElement:true,
                    isNotSet:false,
                    targetNotQuickCloseArr:targetNotQuickCloseArr,
                    value:value,
                    dataInfo:dataInfo,
                    closed:function (data,$popover) {
                        if(data!=false){
                            if(editType==2){
                                data.id = $this.closest('.checklist-item').attr('data-id');
                                that.saveCheckList(data,$this);
                            }else{
                                that.saveTask(data);
                            }
                        }
                        $(that.element).find('.show-span').show();
                    },
                    noInternalInit:noInternalInit,
                    completed:function ($popover) {
                        $(that.element).find('.show-span').show();
                        $this.parent().find('.show-span').hide();
                        if(key=='taskRemark'){
                            $this.closest('.form-group').find('.show-span').hide();
                        }
                    }
                },true);
            });
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action],a[data-action]').off('click').on('click',function (e) {
                var $this = $(this);
                var dataAction = $this.attr('data-action');

                switch (dataAction){

                    case 'closeDialog':
                        S_layer.close($this);
                        $('.m-floating-popover').remove();//关闭浮窗
                        if(that.settings.closeCallBack)
                            that.settings.closeCallBack(that._dataInfo);
                        break;
                    case 'saveCheckListItem'://保存核对清单

                        if($.trim($(that.element).find('input[name="checkListItemName"]').val())==''){
                            S_toastr.error('请输入核对清单内容');
                            return false
                        }
                        that.saveCheckList();

                    case 'showAddCheckList'://显示核对清单

                        if($(that.element).find('#checkList .checklist-list .checklist-item').length==0){
                            $(that.element).find('#checkList').removeClass('hide');
                        }
                        $(that.element).find('.add-new-check').removeClass('hide');
                        $(that.element).find('a[data-action="showAddCheckList"][data-type="2"]').addClass('hide');

                        break;
                    case 'cancelCheckListItem'://取消核对清单
                        if($(that.element).find('#checkList .checklist-list .checklist-item').length==0){
                            $(that.element).find('#checkList').addClass('hide');
                        }
                        $(that.element).find('.add-new-check').addClass('hide');
                        $(that.element).find('a[data-action="showAddCheckList"][data-type="2"]').removeClass('hide');
                        break;

                    case 'delCheckItem'://删除核对清单
                        S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {

                            if(that.settings.doType==2){

                                var checkItemId = $this.closest('.checklist-item').attr('data-id');
                                delObjectInArray(that._dataInfo.checkItemList,function (obj) {
                                    return obj.id == checkItemId;
                                });
                                that.init();

                            }else{
                                var option = {};
                                option.url = restApi.url_lightProject_deleteLightProjectTask;
                                option.postData = {};
                                option.postData.id = $this.closest('.checklist-item').attr('data-id');
                                m_ajax.postJson(option, function (response) {
                                    if (response.code == '0') {
                                        S_toastr.success('删除成功！');
                                        that.init();
                                    } else {
                                        S_layer.error(response.info);
                                    }
                                });
                            }

                        }, function () {
                        });
                        break;

                    case 'addComment'://添加评论
                        if($(that.element).find('.content-editable').text().length==0){
                            S_toastr.error('请输入评论内容');
                            return false
                        }
                        that.saveComment();
                        break;
                    case 'addTags'://添加优先级
                        $this.m_floating_popover({
                            content: template('m_light_project/m_light_project_detail_task_item_tags', {}),
                            placement: 'bottomLeft',
                            popoverStyle:{'z-index':'19891050'},
                            renderedCallBack: function ($popover) {

                                if(that._dataInfo.task && that._dataInfo.task.severity){
                                    $popover.find('a[data-value="'+that._dataInfo.task.severity+'"]').addClass('select');
                                }

                                $popover.find('a').on('click',function () {
                                    if($(this).hasClass('select')){
                                        $(this).removeClass('select');
                                    }else{
                                        $(this).addClass('select');
                                        $(this).addClass('select').parent().siblings().find('a').removeClass('select');
                                    }

                                    var severity = $popover.find('a.select').attr('data-value');
                                    if(severity==undefined){
                                        severity = '';
                                    }
                                    that.saveTask({severity:severity},function () {
                                        $(that.element).find('#tagsBox .severity').html('');
                                        if(severity==''){
                                            $(that.element).find('#tagsBox').addClass('hide');
                                        }else{
                                            var clone = $popover.find('a.select').clone().removeClass('item-line select').css('cursor','default');
                                            $(that.element).find('#tagsBox .severity').append(clone);
                                            $(that.element).find('#tagsBox').removeClass('hide');
                                        }
                                    });
                                });
                            }
                        }, true);
                        break;
                    case 'delTask'://删除任务
                        S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {

                            if(that.settings.doType==2){

                                S_layer.close($this);
                                if(that.settings.closeCallBack)
                                    that.settings.closeCallBack({});

                            }else{
                                var option = {};
                                option.url = restApi.url_lightProject_deleteLightProjectTask;
                                option.postData = {};
                                option.postData.id = that.settings.taskId;
                                m_ajax.postJson(option, function (response) {
                                    if (response.code == '0') {
                                        S_toastr.success('删除成功！');
                                        S_layer.close($this);
                                        if(that.settings.closeCallBack)
                                            that.settings.closeCallBack(that._dataInfo);

                                    } else {
                                        S_layer.error(response.info);
                                    }
                                });
                            }

                        }, function () {
                        });
                        break;
                    case 'copyTask'://复制
                        $this.parents('div').removeClass('open');
                        $this.parents('div').find('a[data-toggle="dropdown"]').m_light_project_task_copy({
                            doType:$this.attr('data-type'),
                            taskId:that.settings.taskId,
                            lightProjectId:that.settings.lightProjectId,
                            saveCallBack:function () {
                                that.init();
                                if(that.settings.closeCallBack)
                                    that.settings.closeCallBack(that._dataInfo);
                            }
                        });
                        break;
                    case 'moveTask'://移动

                        var dataId = $this.attr('data-id');
                        if(dataId!=that._dataInfo.task.groupId){
                            that.saveMoveTask(dataId);
                        }

                        break;
                }
                return false;
            });

            $(that.element).find('.content-editable').on('keyup',function (e) {

                var $this = $(this);
                //判断光标的前个字符是否是“@”
                if(document.all){
                    that.range=document.selection.createRange();
                    that.range.select();
                    that.range.moveStart("character",-1);
                }else{
                    that.range=window.getSelection().getRangeAt(0);
                    //that.range.setStart(that.range.startContainer,0);
                }
                //console.log(that.range.endOffset)

                if (window.getSelection) {
                    var sel = window.getSelection();
                    if (sel.getRangeAt && sel.rangeCount) {
                        var range = sel.getRangeAt(0);
                    }
                }

                if($this.text().length>0){
                    $(that.element).find('.content-editable-placeholder').hide();
                }else{
                    $(that.element).find('.content-editable-placeholder').show();
                }
            });
            $(that.element).find('.content-editable-placeholder').on('click',function () {
                $(that.element).find('.content-editable').focus();
            });

            $(that.element).find('button[data-action="selectUser"]').each(function (i) {
                var $this = $(this);
                var editType = $this.attr('data-edit-type');
                var popoverStyle = {'width':'230px'};
                var value = [];
                if(editType==2){
                    popoverStyle = {'width':'600px'};
                    if(that._dataInfo.memberList && that._dataInfo.memberList.length>0){
                        $.each(that._dataInfo.memberList,function (i,item) {
                            value.push({id:item.companyUserId,text:item.userName})
                        });
                    }
                }else{
                    if(that._dataInfo.principalUser && that._dataInfo.principalUser.companyUserId){
                        value.push({id:that._dataInfo.principalUser.companyUserId,text:that._dataInfo.principalUser.userName});
                    }

                }
                $this.m_editable({
                    inline: true,
                    popoverStyle:popoverStyle,
                    hideElement: true,
                    isNotSet: false,
                    value: value,
                    dataInfo: null,
                    targetNotQuickCloseArr: ['select2-selection__choice', 'select2-search--dropdown', 'select2-search__field', 'select2-results__options'],
                    postParam:{id:that.settings.lightProjectId},
                    closed: function (data, $popover) {

                        if(data!=false){
                            if(editType==2){
                                that.savePrincipal(2,data);
                            }else{
                                that.savePrincipal(1,data);
                            }
                        }
                        $(that.element).find('.show-span').show();
                    },
                    completed: function ($popover) {
                        $(that.element).find('.show-span').show();
                        $this.parent().find('.show-span').hide();
                    }
                }, true);
            });

            $(that.element).find('.content-editable').keydown(function () {
                if (event.keyCode == '13') {//keyCode=13是回车键
                    $(that.element).find('button[data-action="addComment"]').click();
                }
            });
            $(that.element).find('input[name="checkListItemName"]').keydown(function () {
                if (event.keyCode == '13') {//keyCode=13是回车键
                    $(that.element).find('button[data-action="saveCheckListItem"]').click();

                    var t = setTimeout(function () {
                        $(that.element).find('a[data-action="showAddCheckList"]').click();
                        clearTimeout(t);
                    },200)

                }
            });

        }
        ,pasteHtmlAtCaret:function (html) {
            var sel, range;
            if (window.getSelection) {
                sel = window.getSelection();
                if (sel.getRangeAt && sel.rangeCount) {
                    range = sel.getRangeAt(0);
                    range.deleteContents();
                    var el = document.createElement("div");
                    el.innerHTML = html;
                    var frag = document.createDocumentFragment(), node, lastNode;
                    while ( (node = el.firstChild) ) {
                        lastNode = frag.appendChild(node);
                    };
                    range.insertNode(frag);
                    if (lastNode) {
                        range = range.cloneRange();
                        range.setStartAfter(lastNode);
                        range.collapse(true);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    };
                };
            } else if (document.selection && document.selection.type != "Control") {
                // IE9以下
                document.selection.createRange().pasteHTML(html);
            };
            //console.log(range)
        }
        ,saveTaskSort:function () {
            var that = this;
            if(that.settings.doType==2){


            }else{
                var option = {};
                option.url = restApi.url_lightProject_moveLightProjectTaskList;
                option.postData = {};
                var moveList = [];
                $(that.element).find('#checklistList li').each(function () {
                    moveList.push($(this).attr('data-id'));
                });
                option.postData.moveList = moveList;
                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {
                        that.init();
                    } else {
                        S_layer.error(response.info);
                    }
                });
            }
        }
        //拖拽
        ,sortTable: function () {
            var that = this;
            var sortable = Sortable.create(document.getElementById('checklistList'), {
                animation: 200,
                ghostClass: 'my-sortable-ghost',
                chosenClass: 'my-sortable-chosen',
                dragClass: 'my-sortable-drag',
                sort: true,
                onEnd: function(evt){ //拖拽完毕之后发生该事件
                    //console.log('onEnd.foo:', [evt.item, evt.from]);
                    //console.log(evt);
                    that.saveTaskSort();
                }
            });

        }

    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            // if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" +
                pluginName, new Plugin(this, options));
            // }
        });
    };

})(jQuery, window, document);
