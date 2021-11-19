import IPy

__all__ = ["get_ip_address", "if_internal_ip", "tag_formatter", "single_tag_formatter"]


def get_ip_address(request):
    """
    获取ip地址
    :param request:
    :return:
    """
    ip = request.META.get("HTTP_X_FORWARDED_FOR", "")

    if not ip:
        ip = request.META.get('REMOTE_ADDR', "")
    client_ip = ip.split(",")[-1].strip() if ip else ""
    return client_ip


def if_internal_ip(internal, client_ip):
    # todo
    return client_ip in IPy.IP(internal)


def tag_formatter(tag):
    def add_tags(element, *args, **kwargs):
        tag_properties = ''
        for k, v in kwargs.items():
            if k == 'cls_property':
                tag_properties += f"class = '{v}'"
            elif k == "fortag":
                tag_properties += f"for = '{v}'"
            else:
                tag_properties += f"{k} = '{v}'"
        return f"<{tag} {tag_properties}>{element}</{tag}>"

    return add_tags


def single_tag_formatter(tag):
    def add_tags(*args, **kwargs):
        tag_properties = ''
        for k, v in kwargs.items():
            if k == 'cls_property':
                tag_properties += f"class = '{v}'"
            elif k == "fortag":
                tag_properties += f"for = '{v}'"
            else:
                tag_properties += f"{k} = '{v}'"
        return f"<{tag} {tag_properties}/>"

    return add_tags
